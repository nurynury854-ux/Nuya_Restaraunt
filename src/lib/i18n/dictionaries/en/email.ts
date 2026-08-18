export const email = {
  verification: {
    subject: "Verify your email — {businessName}",
    heading: "Verify your email",
    greeting: "Hi,",
    body: "Click the button below to verify your email address for {businessName}.",
    button: "Verify Email",
    fallback: "Or copy and paste this link into your browser:",
    expiry: "This link expires in 24 hours.",
  },
  passwordReset: {
    subject: "Reset your password",
    heading: "Reset your password",
    greeting: "Hi,",
    body: "We received a request to reset the password for your {businessName} account.",
    button: "Reset Password",
    fallback: "Or copy and paste this link into your browser:",
    ignoreIfNotYou: "If you didn't request this, you can safely ignore this email — your password won't change.",
    expiry: "This link expires in 1 hour.",
  },
};
