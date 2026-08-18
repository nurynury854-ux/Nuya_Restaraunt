import { createAuthToken } from "@/lib/authTokens";
import { sendEmail } from "@/lib/email/send";
import { renderActionEmail } from "@/lib/email/templates";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { formatMessage } from "@/lib/i18n/format";

interface AuthEmailParams {
  adminUserId: string;
  to: string;
  businessName: string;
  /** The request's own origin (`request.nextUrl.origin`) — keeps the link
   * correct with zero config whether this is localhost, the current
   * `*.vercel.app` domain, or a custom domain added later. */
  origin: string;
}

export async function sendVerificationEmail(params: AuthEmailParams): Promise<boolean> {
  const raw = await createAuthToken(params.adminUserId, "EMAIL_VERIFICATION");
  const { dict } = await getServerDictionary();
  const t = dict.email.verification;
  const url = `${params.origin}/verify-email?token=${raw}`;

  return sendEmail({
    to: params.to,
    subject: formatMessage(t.subject, { businessName: params.businessName }),
    html: renderActionEmail({
      heading: t.heading,
      greeting: t.greeting,
      body: formatMessage(t.body, { businessName: params.businessName }),
      buttonLabel: t.button,
      buttonUrl: url,
      fallbackLabel: t.fallback,
      footerLines: [t.expiry],
    }),
  });
}

export async function sendPasswordResetEmail(params: AuthEmailParams): Promise<boolean> {
  const raw = await createAuthToken(params.adminUserId, "PASSWORD_RESET");
  const { dict } = await getServerDictionary();
  const t = dict.email.passwordReset;
  const url = `${params.origin}/reset-password?token=${raw}`;

  return sendEmail({
    to: params.to,
    subject: t.subject,
    html: renderActionEmail({
      heading: t.heading,
      greeting: t.greeting,
      body: formatMessage(t.body, { businessName: params.businessName }),
      buttonLabel: t.button,
      buttonUrl: url,
      fallbackLabel: t.fallback,
      footerLines: [t.ignoreIfNotYou, t.expiry],
    }),
  });
}
