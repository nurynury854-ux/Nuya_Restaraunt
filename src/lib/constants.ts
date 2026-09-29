export const DINING_METHODS = ["DINE_IN", "PICKUP", "DELIVERY"] as const;
export type DiningMethod = (typeof DINING_METHODS)[number];

export const ORDER_STATUSES = ["PENDING", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Pending vs Completed orders — the two separate admin sections. Cancelled
// orders are no longer actionable so they live alongside completed ones (as
// history) rather than getting a third section.
export const PENDING_STATUSES: OrderStatus[] = ["PENDING"];
export const COMPLETED_STATUSES: OrderStatus[] = ["COMPLETED", "CANCELLED"];

export const PAYMENT_METHODS = ["CASH", "TRANSFER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TIME_SLOT_METHODS = ["PICKUP", "DELIVERY"] as const;
export type TimeSlotMethod = (typeof TIME_SLOT_METHODS)[number];

export const PLATFORM_NAME = "Nuya";

// Billing. A tenant's own subscription to this platform — unrelated to
// PAYMENT_METHODS above, which is how a diner pays the restaurant.
export const SUBSCRIPTION_STATUSES = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Length of the no-card-required trial every new tenant gets at signup. */
export const TRIAL_DAYS = 14;
