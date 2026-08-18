import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";

/**
 * Best-effort send — never throws. Callers that gate a user-facing flow on
 * "check your email" must still succeed even if delivery fails (e.g. no
 * verified sending domain yet, or Resend is down); failures are logged
 * server-side instead of surfacing as a broken signup/login.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error(`RESEND_API_KEY is not set — skipped sending "${subject}" to ${to}`);
    return false;
  }
  try {
    const { error } = await getResendClient().emails.send({ from: EMAIL_FROM, to, subject, html });
    if (error) {
      console.error("Resend send error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
