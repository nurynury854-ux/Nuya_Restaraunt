import { TRIAL_DAYS } from "@/lib/constants";
import { dateOnlyUTC, todayPartsInTimezone } from "@/lib/timezone";

/**
 * Decides whether a tenant's public ordering site is open for business.
 *
 * Billing is manual: tenants pay the platform owner by bank transfer, and the
 * platform owner records it from /platform-admin by approving the tenant and
 * setting the last day they've paid for. A new tenant gets a free trial first,
 * so the flow is:
 *
 *   signup ── trial (site live) ──┬── approved + paid through a date ── live
 *                                 └── trial over, not paid ─────────── closed
 *
 * The owner can be approved mid-trial if they pay early; paid time and trial
 * time simply both count.
 *
 * Deliberately split from the admin panel's gate. The admin panel stays
 * reachable on a lapsed tenant so they can keep editing their menu and see how
 * to pay; the storefront is the thing they're paying for, so that's what
 * closes. That split is also why the check lives here and not in
 * src/proxy.ts: the proxy verifies a stateless HMAC session with no database
 * call at all.
 *
 * (The Stripe fields on Tenant are a dormant, not-yet-enabled alternative and
 * are intentionally ignored here.)
 */

/** The fields any billing decision needs. Widened so callers can pass a whole Tenant. */
export interface BillingSubject {
  isActive: boolean;
  trialEndsAt: Date | null;
  approvedAt: Date | null;
  paidThrough: Date | null;
  timezone: string;
}

export function isTrialActive(trialEndsAt: Date | null, now: Date = new Date()): boolean {
  return !!trialEndsAt && trialEndsAt.getTime() > now.getTime();
}

/** The tenant's own calendar day, in the same UTC-midnight form as paidThrough. */
function tenantToday(timezone: string): Date {
  const { year, month, day } = todayPartsInTimezone(timezone);
  return dateOnlyUTC(year, month, day);
}

/**
 * Whether the tenant has paid time left. paidThrough is inclusive and in the
 * tenant's own calendar, so a tenant paid through the 30th stays open until
 * midnight *their* time, not the server's.
 */
export function isPaidPeriodCurrent(tenant: BillingSubject): boolean {
  if (!tenant.approvedAt) return false;
  if (!tenant.paidThrough) return true; // approved with no end date
  return tenant.paidThrough.getTime() >= tenantToday(tenant.timezone).getTime();
}

/**
 * Where a tenant stands, for the admin panel and the platform dashboard.
 *
 * - TRIAL: in the free trial, not yet paid.
 * - TRIAL_ENDED: trial over and never paid — waiting on a first payment.
 * - PAID: approved and within their paid period (or no end date).
 * - EXPIRED: was paid, but the paid period has run out.
 */
export type BillingState = "TRIAL" | "TRIAL_ENDED" | "PAID" | "EXPIRED";

export function getBillingState(tenant: BillingSubject, now: Date = new Date()): BillingState {
  if (isPaidPeriodCurrent(tenant)) return "PAID";
  if (isTrialActive(tenant.trialEndsAt, now)) return "TRIAL";
  return tenant.approvedAt ? "EXPIRED" : "TRIAL_ENDED";
}

/** Whole reason-carrying answer, so callers can show the right screen. */
export type StorefrontState = "OPEN" | "SUSPENDED" | "BILLING_LAPSED";

export function getStorefrontState(
  tenant: BillingSubject | null,
  now: Date = new Date()
): StorefrontState | "MISSING" {
  if (!tenant) return "MISSING";
  // Platform suspension outranks billing: a tenant we've banned stays hidden
  // even with a paid period in good standing.
  if (!tenant.isActive) return "SUSPENDED";
  const state = getBillingState(tenant, now);
  return state === "PAID" || state === "TRIAL" ? "OPEN" : "BILLING_LAPSED";
}

/** Convenience for the public API routes, which only need the yes/no. */
export function isStorefrontOpen(tenant: BillingSubject | null, now: Date = new Date()): boolean {
  return getStorefrontState(tenant, now) === "OPEN";
}

export function trialEndDateFrom(start: Date = new Date()): Date {
  return new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

/** Whole days left, floored at 0. For the "N days left" nudge in the panel. */
export function trialDaysRemaining(trialEndsAt: Date | null, now: Date = new Date()): number {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * Days of paid time left, counting today (so 1 = "last day today"). Null
 * when there's no paid period with an end date to count down to.
 */
export function paidDaysRemaining(tenant: BillingSubject): number | null {
  if (!tenant.approvedAt || !tenant.paidThrough) return null;
  const days = Math.round(
    (tenant.paidThrough.getTime() - tenantToday(tenant.timezone).getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.max(0, days + 1);
}

/** Parses a "YYYY-MM-DD" date-input value into the stored UTC-midnight form. */
export function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return dateOnlyUTC(year, month, day);
}

/** The stored UTC-midnight form back to "YYYY-MM-DD" for a date input. */
export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
