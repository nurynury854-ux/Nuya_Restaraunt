import Stripe from "stripe";

let client: Stripe | undefined;

/**
 * Constructed lazily, on first use. The `Stripe` constructor throws when the
 * secret key is missing, and building this at module load would crash every
 * environment that hasn't set it — including the production build itself —
 * rather than just the one request that needed billing. Same reasoning as
 * `getResendClient()`.
 *
 * No `apiVersion` is pinned here on purpose: the SDK already pins the version
 * its own types were generated against, and naming a different one is how you
 * get types that quietly disagree with the JSON actually coming back.
 */
export function getStripeClient(): Stripe {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return client;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new BillingNotConfiguredError(name);
  return value;
}

export class BillingNotConfiguredError extends Error {
  constructor(missingVar: string) {
    super(`Billing is not configured on this deployment (${missingVar} is unset)`);
  }
}

/**
 * Whether this deployment can actually take a payment. Mirrors
 * `isEmailDeliverable()` — a deploy with no Stripe keys should say so instead
 * of showing a Subscribe button that 500s. Describes the deployment, never a
 * particular tenant, so it's safe to surface.
 */
export function isBillingConfigured(): boolean {
  return (
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.STRIPE_PRICE_ID) &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET)
  );
}

export function getPriceId(): string {
  return requireEnv("STRIPE_PRICE_ID");
}

export function getWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}
