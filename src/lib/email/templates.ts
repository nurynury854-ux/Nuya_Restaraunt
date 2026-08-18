import { PLATFORM_NAME } from "@/lib/constants";

/**
 * Shared layout for the transactional "click a button to do a thing" emails
 * (verify email, reset password). Deliberately plain inline-styled HTML
 * rather than a React Email setup — two templates doesn't justify the extra
 * dependency, and every client-facing string is passed in already
 * translated by the caller (see getServerDictionary() call sites), so this
 * file has no locale awareness of its own.
 */
export function renderActionEmail({
  heading,
  greeting,
  body,
  buttonLabel,
  buttonUrl,
  fallbackLabel,
  footerLines,
}: {
  heading: string;
  greeting: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  fallbackLabel: string;
  footerLines: string[];
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f7f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#1c1917;">${PLATFORM_NAME}</p>
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1c1917;">${heading}</h1>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#44403c;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#44403c;">${body}</p>
          <table role="presentation">
            <tr>
              <td style="border-radius:12px;background:#c8722e;">
                <a href="${buttonUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 4px;font-size:12px;color:#a8a29e;">${fallbackLabel}</p>
          <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#78716c;">
            <a href="${buttonUrl}" style="color:#c8722e;">${buttonUrl}</a>
          </p>
          ${footerLines.map((line) => `<p style="margin:0 0 4px;font-size:12px;color:#a8a29e;">${line}</p>`).join("")}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
