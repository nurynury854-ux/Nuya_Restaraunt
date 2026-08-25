export const auth = {
  /**
   * Keyed by the `code` an auth endpoint returns alongside its English
   * `error` string, so a failure reads in the user's own language. Anything
   * without a code still falls back to the server's `error` text.
   */
  errors: {
    invalid_credentials: "Incorrect email or password",
    tenant_inactive: "This site has been deactivated. Please contact support.",
    rate_limited: "Too many attempts. Please wait a minute and try again.",
  } as Record<string, string>,
  login: {
    subtitle: "Log in to your admin panel",
    email: "Email",
    password: "Password",
    submit: "Log In",
    loginFailed: "Login failed",
    noSiteYet: "Don't have a site yet?",
    createOne: "Create one",
    forgotPassword: "Forgot password?",
  },
  forgotPassword: {
    subtitle: "Reset your password",
    email: "Email",
    submit: "Send Reset Link",
    genericSuccess: "If an account exists for that email, we've sent a password reset link.",
    mailNotConfigured:
      "This deployment can't send email yet, so no reset link will arrive. Ask whoever runs the site to reset your password for you.",
    backToLogin: "Back to log in",
  },
  resetPassword: {
    subtitle: "Choose a new password",
    newPassword: "New password",
    passwordHint: "At least 8 characters",
    submit: "Reset Password",
    invalidToken: "This reset link is invalid or has expired.",
    requestNewLink: "Request a new link",
    success: "Your password has been reset.",
    goToLogin: "Go to log in",
  },
  verifyEmail: {
    confirmPrompt: "Confirm this is your email address to finish verifying it.",
    confirmButton: "Verify My Email",
    verifying: "Verifying your email...",
    success: "Your email has been verified.",
    invalidToken: "This verification link is invalid or has expired.",
    continueToAdmin: "Continue to your admin panel",
    missingToken: "This link is missing its verification code.",
  },
  signup: {
    subtitle: "Create your online ordering site",
    businessName: "Business name",
    businessNamePlaceholder: "e.g. Joe's Cafe",
    siteUrl: "Your site's URL",
    siteUrlHint: "Letters, numbers, and hyphens only",
    siteUrlTaken: "That URL is taken",
    firstLocationName: "First location name",
    firstLocationHint: "You can add more locations later",
    firstLocationPlaceholder: "e.g. Main Location",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters",
    submit: "Create My Site",
    genericError: "Something went wrong",
    alreadyHaveSite: "Already have a site?",
    logIn: "Log in",
  },
};
