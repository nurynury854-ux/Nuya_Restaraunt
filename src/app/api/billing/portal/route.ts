import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { requireAdminSession } from "@/lib/adminAuth";
import { getStripeClient, BillingNotConfiguredError } from "@/lib/stripe";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

/**
 * Opens Stripe's hosted Customer Portal for the signed-in tenant.
 *
 * This is what spares the app from building card management, invoice history,
 * plan changes and cancellation itself — all of it lives in Stripe, and any
 * change made there comes back as a webhook. What the portal actually offers
 * is configured once in the Stripe dashboard, not here.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "billing", RATE_LIMITS.billing);
    if (limited) return limited;

    const session = await requireAdminSession();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { slug: true, stripeCustomerId: true },
    });

    // No Stripe customer means they've never started Checkout, so there is no
    // billing history to manage yet. Say so rather than 500ing on a null id.
    if (!tenant?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account yet — subscribe first." },
        { status: 409 }
      );
    }

    const portal = await getStripeClient().billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${request.nextUrl.origin}/${tenant.slug}/admin/billing`,
    });

    return NextResponse.json({ url: portal.url });
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
