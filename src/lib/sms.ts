/**
 * Mitake (三竹簡訊) SMS client — the "order completed" notification to
 * customers. Each tenant brings their own Mitake account (see
 * src/components/admin/settings/SmsSettingsForm.tsx); there is no shared
 * platform account, since a shared one would send every tenant's messages
 * under one undifferentiated sender.
 *
 * API confirmed against Mitake's own PHP SDK source (github.com/minchao/mitake-php)
 * — this project has no account to test the live API against, so verify a
 * real send against your own Mitake account before relying on this.
 */

const MITAKE_BASE_URL = "https://smsapi.mitake.com.tw/api/mtk/SmSend";

export interface SendSmsResult {
  ok: boolean;
  /** Mitake's own message id, when the send was accepted. */
  msgId?: string;
  error?: string;
}

/** A Taiwan mobile number as Mitake expects it: 10 digits, leading 09. */
export function isValidTaiwanMobile(phone: string): boolean {
  return /^09\d{8}$/.test(phone.replace(/[\s-]/g, ""));
}

export async function sendSms(params: {
  username: string;
  password: string;
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  const url = new URL(MITAKE_BASE_URL);
  url.searchParams.set("username", params.username);
  url.searchParams.set("password", params.password);
  url.searchParams.set("CharsetURL", "UTF-8");
  url.searchParams.set("dstaddr", params.to);
  url.searchParams.set("smbody", params.body);

  let res: Response;
  try {
    res = await fetch(url.toString(), { method: "POST" });
  } catch {
    return { ok: false, error: "Couldn't reach Mitake's API" };
  }

  if (!res.ok) {
    return { ok: false, error: `Mitake returned HTTP ${res.status}` };
  }

  const text = (await res.text()).trim();
  // Response is `key=value` lines (INI-style), e.g.:
  //   msgid=1234567890
  //   statuscode=1
  const fields: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    fields[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }

  // statuscode "1" is the only documented success code for a single send —
  // anything else (bad credentials, insufficient balance, invalid number,
  // etc.) is surfaced as-is since this project can't verify Mitake's full
  // error-code table against a live account.
  if (fields.statuscode === "1") {
    return { ok: true, msgId: fields.msgid };
  }
  return {
    ok: false,
    error: fields.statuscode
      ? `Mitake rejected the message (status code ${fields.statuscode})`
      : `Unrecognized response from Mitake: ${text.slice(0, 200)}`,
  };
}

/**
 * Best-effort "your order is ready" SMS. Never throws — a tenant without SMS
 * configured, an invalid phone number, or a failed send must never block or
 * fail the order-completion request itself; the caller just doesn't get a
 * text. Logs failures to the server console so they're at least diagnosable.
 */
export async function notifyOrderCompleted(params: {
  tenant: { businessName: string; smsUsername: string | null; smsPasswordEnc: string | null };
  order: { orderNo: string; customerPhone: string };
}): Promise<void> {
  const { tenant, order } = params;
  if (!tenant.smsUsername || !tenant.smsPasswordEnc) return;
  if (!isValidTaiwanMobile(order.customerPhone)) return;

  try {
    const { decryptSecret } = await import("@/lib/secretCrypto");
    const password = decryptSecret(tenant.smsPasswordEnc);
    const body = `【${tenant.businessName}】您的訂單 ${order.orderNo} 已完成，請取餐，謝謝！`;
    const result = await sendSms({
      username: tenant.smsUsername,
      password,
      to: order.customerPhone,
      body,
    });
    if (!result.ok) {
      console.error(`[sms] order ${order.orderNo} notification failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`[sms] order ${order.orderNo} notification threw:`, error);
  }
}
