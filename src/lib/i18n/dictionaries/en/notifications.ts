export const notifications = {
  nav: "Notifications",
  heading: "Customer Notifications",
  subheading: "Text your customers when their order is ready",

  sms: {
    heading: "SMS (via Mitake / 三竹簡訊)",
    intro:
      "Connect your own Mitake account to text a customer automatically when their order is marked Completed. This is a template, so every business connects its own account — messages send under your account, not a shared one.",
    howTo:
      "Don't have an account? Sign up at mitake.com.tw, then come back and paste your username and password below.",
    status: {
      configured: "SMS notifications are on, using the account \"{username}\".",
      notConfigured: "SMS notifications are off.",
    },
    username: "Mitake username",
    password: "Mitake password",
    passwordHint: "Stored encrypted — never shown again after you save it.",
    save: "Save",
    saveError: "Couldn't save your SMS settings",
    disconnect: "Turn off SMS",
    disconnectConfirm: "Turn off SMS notifications for this business?",
    test: {
      heading: "Send a test message",
      hint: "Confirms your account works before a real customer order depends on it.",
      phone: "Your phone number",
      phonePlaceholder: "e.g. 0912345678",
      send: "Send test",
      sent: "Test message sent — check your phone.",
      error: "Couldn't send the test message",
      needsSetup: "Save your username and password first.",
    },
  },
};
