import { Resend } from "resend";

let client: Resend | undefined;

/**
 * Constructed lazily, on first actual send — the `Resend` constructor
 * throws immediately if `RESEND_API_KEY` is missing, and building this
 * eagerly at module load would crash every environment (including the
 * production build itself) that hasn't set the key yet, not just the send
 * call that needed it. `sendEmail()` already checks for the key before
 * calling this, so a missing key never reaches the constructor.
 */
export function getResendClient(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * Until a custom domain is verified in Resend, mail can only go out from
 * their shared sandbox address — and only to the Resend account's own
 * verified inbox, not arbitrary recipients. Override via EMAIL_FROM once a
 * sending domain is verified (see README).
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || "Bogi <onboarding@resend.dev>";
