export const billing = {
  nav: "Billing",
  heading: "Billing",
  subheading: "Your {platform} plan",

  status: {
    label: "Status",
    trial: "Free trial",
    trialEnded: "Trial ended",
    paid: "Paid",
    expired: "Payment due",
  },

  // One line under the status badge explaining what it means for their site.
  state: {
    trial: "Your ordering site is live. Your free trial ends in {days} days.",
    trialLastDay: "Your ordering site is live. Your free trial ends today.",
    trialEnded:
      "Your free trial has ended and your ordering site is offline. It goes live again as soon as we've received your payment.",
    paidThrough: "Your ordering site is live. You're paid through {date}.",
    paidNoEnd: "Your ordering site is live.",
    expired:
      "Your paid period ended on {date} and your ordering site is offline. Send a payment to bring it back.",
  },

  siteLive: "Site live",
  siteOffline: "Site offline",

  // What a lapsed tenant can still do, so the admin panel doesn't feel broken.
  adminStillOpen:
    "You can still edit your menu and settings while your site is offline — nothing has been deleted.",

  howToPay: {
    heading: "How to pay",
    intro:
      "Pay by bank transfer. Put your reference code and business name in the transfer note so we can match the payment to your account.",
    reference: "Reference code",
    businessName: "Business name",
    copy: "Copy",
    copied: "Copied",
    transferDetails: "Transfer details",
    noInstructions: "Contact us for our bank transfer details.",
    afterPaying:
      "Once we've received your transfer we'll activate your account — there's nothing else to do here. You can pay any time, including during your free trial.",
  },

  banner: {
    trialEnding: "Your free trial ends in {days} days. Pay by bank transfer to keep your site online.",
    trialEndingToday: "Your free trial ends today. Pay by bank transfer to keep your site online.",
    trialEnded:
      "Your free trial has ended, so your ordering site is offline until we receive your payment.",
    paidEnding: "Your paid period ends in {days} days. Send your next payment to keep your site online.",
    paidEndingToday: "Your paid period ends today. Send your next payment to keep your site online.",
    expired:
      "Your paid period has ended, so your ordering site is offline until we receive your payment.",
    action: "How to pay",
  },
};
