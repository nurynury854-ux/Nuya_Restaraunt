import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { requireAdminSession } from "@/lib/adminAuth";
import { getStripeClient, getPriceId, BillingNotConfiguredError } from "@/lib/stripe";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

/**
 * Starts a Stripe Checkout session for the signed-in tenant's own
 * subscription. Returns the hosted Checkout URL for the client to send the
 * browser to; it deliberately writes nothing about subscription state, which
 * only the webhook is allowed to do.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "billing", RATE_LIMITS.billing);
    if (limited) return limited;

    // The tenant comes from the session cookie, never from the request body —
    // otherwise one tenant could open a Checkout that credits another.
    const session = await requireAdminSession();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        slug: true,
        businessName: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
      },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // A tenant who already has a live subscription must go to the Customer
    // Portal, not through Checkout again — Stripe will happily create a second
    // subscription on the same customer and bill for both. PAST_DUE counts as
    // live here: the fix for a failed payment is a new card, not a new
    // subscription alongside the one that's already failing.
    if (tenant.subscriptionStatus === "ACTIVE" || tenant.subscriptionStatus === "PAST_DUE") {
      return NextResponse.json(
        { error: "You already have a subscription — manage it from the billing portal." },
        { status: 409 }
      );
    }

    const stripe = getStripeClient();

    // Reuse the tenant's existing Stripe customer so a second subscription
    // attempt doesn't strand their billing history across two customer
    // records. Created here rather than at signup so tenants who never
    // subscribe leave nothing behind in Stripe.
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.email,
        name: tenant.businessName,
        metadata: { tenantId: tenant.id, tenantSlug: tenant.slug },
      });
      customerId = customer.id;
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const billingUrl = `${request.nextUrl.origin}/${tenant.slug}/admin/billing`;

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getPriceId(), quantity: 1 }],
      // Both of these carry the tenant id back to the webhook.
      // `client_reference_id` rides on the Checkout session;
      // `subscription_data.metadata` is stamped onto the subscription itself,
      // so later subscription events can still be traced to a tenant.
      client_reference_id: tenant.id,
      subscription_data: {
        metadata: { tenantId: tenant.id, tenantSlug: tenant.slug },
      },
      success_url: `${billingUrl}?checkout=success`,
      cancel_url: `${billingUrl}?checkout=cancelled`,
    });

    if (!checkout.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    if (error instanceof BillingNotConfiguredError) {
      console.error(error);
      return NextResponse.json(
        { error: "Billing isn't set up on this deployment yet." },
        { status: 503 }
      );
    }
    return handleApiError(error);
  }
}
