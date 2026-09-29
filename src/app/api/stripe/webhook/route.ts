import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, getWebhookSecret } from "@/lib/stripe";
import type { SubscriptionStatus } from "@/lib/constants";

/**
 * The single writer of tenant subscription state.
 *
 * Nothing else — not the browser's redirect back from Checkout, not the
 * billing page — is allowed to mark a tenant paid. That return trip is just a
 * URL the customer's browser can be pointed at, so treating it as proof of
 * payment would hand out free subscriptions to anyone who guessed the success
 * URL. Stripe's signed webhook is the only trustworthy channel.
 */

// Signature verification hashes the exact bytes Stripe sent. Parsing the body
// as JSON first and re-serializing it would change those bytes (key order,
// whitespace, unicode escapes) and every signature check would fail, so the
// raw text has to be read before anything else touches the request.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await getStripeClient().webhooks.constructEventAsync(
      rawBody,
      signature,
      getWebhookSecret()
    );
  } catch (error) {
    // A bad signature is an unauthenticated caller, not a server fault — 400
    // so Stripe doesn't retry something that can never succeed.
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const tenantId = session.client_reference_id ?? session.metadata?.tenantId;
        const subscriptionId = asId(session.subscription);
        if (tenantId && subscriptionId) {
          await syncSubscription(tenantId, subscriptionId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const tenantId = await resolveTenantId(subscription);
        if (tenantId) await syncSubscription(tenantId, subscription.id);
        break;
      }

      // Payment outcomes don't carry subscription status themselves; they just
      // tell us the subscription probably moved. Re-reading it is simpler and
      // more accurate than inferring a status from the invoice.
      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const tenant = await prisma.tenant.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
            select: { id: true },
          });
          if (tenant) await syncSubscription(tenant.id, subscriptionId);
        }
        break;
      }

      default:
        // Everything else is noise for our purposes. Acknowledge it so Stripe
        // stops retrying rather than letting it pile up in the dashboard.
        break;
    }
  } catch (error) {
    // 500 asks Stripe to retry. Since every branch above re-reads the
    // subscription and writes the whole current truth, a retry is harmless.
    console.error(`Stripe webhook handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Writes the tenant's billing columns from the live subscription.
 *
 * Always re-fetches from Stripe rather than trusting the event payload. Stripe
 * makes no ordering guarantee and redelivers freely, so an out-of-order
 * `updated` carrying stale fields could otherwise resurrect a cancelled
 * subscription. Re-reading makes every event idempotent and order-independent:
 * whatever order they arrive in, the last one to land writes current truth.
 */
async function syncSubscription(tenantId: string, subscriptionId: string) {
  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionStatus: mapStatus(subscription.status),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: asId(subscription.customer),
      currentPeriodEnd: currentPeriodEndOf(subscription),
    },
  });
}

/**
 * Stripe's subscription statuses collapsed onto the four this app stores.
 *
 * `incomplete` (initial payment never finished) and `paused` both close the
 * storefront, but that costs a tenant nothing if they're still inside their
 * trial — `isSubscriptionCurrent` keeps them open on trial time regardless of
 * status, so a half-finished Checkout can't cut a trial short.
 */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    default:
      return "CANCELED";
  }
}

/**
 * Stripe moved `current_period_end` off the subscription and onto each
 * subscription item. With a single-price plan there's exactly one item; taking
 * the latest across items keeps this correct if the plan ever gains a second.
 */
function currentPeriodEndOf(subscription: Stripe.Subscription): Date | null {
  const ends = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  if (ends.length === 0) return null;
  return new Date(Math.max(...ends) * 1000);
}

/**
 * Finds the tenant a subscription belongs to. Prefers the metadata stamped at
 * Checkout, then falls back to the stored Stripe ids — which is what catches a
 * subscription created directly in the Stripe dashboard, where no metadata was
 * ever set.
 */
async function resolveTenantId(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.tenantId;
  if (fromMetadata) return fromMetadata;

  const customerId = asId(subscription.customer);
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        ...(customerId ? [{ stripeCustomerId: customerId }] : []),
      ],
    },
    select: { id: true },
  });
  return tenant?.id ?? null;
}

/** Stripe returns either a bare id or an expanded object depending on the call. */
function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * The invoice's subscription reference. Recent API versions carry it per line
 * item under `parent` rather than as a top-level `subscription` field, so this
 * reads whichever one this invoice actually has.
 */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent?.subscription_details?.subscription;
  if (parent) return asId(parent);

  for (const line of invoice.lines?.data ?? []) {
    const fromLine = line.parent?.subscription_item_details?.subscription;
    if (fromLine) return asId(fromLine);
  }
  return null;
}
