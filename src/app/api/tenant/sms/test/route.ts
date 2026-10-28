import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { handleApiError } from "@/lib/apiResponse";
import { smsTestSchema } from "@/lib/validation";
import { rateLimitByKey, RATE_LIMITS } from "@/lib/rateLimit";
import { decryptSecret } from "@/lib/secretCrypto";
import { sendSms } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    const limited = rateLimitByKey(`smsTest:${session.tenantId}`, RATE_LIMITS.smsTest);
    if (limited) return limited;

    const body = await request.json();
    const { phone } = smsTestSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { businessName: true, smsUsername: true, smsPasswordEnc: true },
    });
    if (!tenant?.smsUsername || !tenant.smsPasswordEnc) {
      return NextResponse.json(
        { error: "Save your Mitake username and password first" },
        { status: 400 }
      );
    }

    const result = await sendSms({
      username: tenant.smsUsername,
      password: decryptSecret(tenant.smsPasswordEnc),
      to: phone,
      body: `【${tenant.businessName}】這是一則測試訊息，您的簡訊通知已設定成功！`,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
