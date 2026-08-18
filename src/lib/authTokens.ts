import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type AuthTokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

const TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 1000 * 60 * 60 * 24, // 24h
  PASSWORD_RESET: 1000 * 60 * 60, // 1h
};

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Creates a new auth token for an admin user and returns the RAW token to
 * embed in the email link — only its hash is persisted, so a database read
 * leak alone can't be redeemed as a live verify/reset link (same reasoning
 * as never storing a plaintext password). Any of the user's existing unused
 * tokens of the same type are cleared first, so only the most recently
 * issued link for a given purpose is ever valid — requesting a new
 * password-reset email invalidates an older, unused one.
 */
export async function createAuthToken(
  adminUserId: string,
  type: AuthTokenType
): Promise<string> {
  const raw = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { adminUserId, type } }),
    prisma.authToken.create({
      data: {
        adminUserId,
        type,
        token: hashToken(raw),
        expiresAt: new Date(Date.now() + TTL_MS[type]),
      },
    }),
  ]);
  return raw;
}

/**
 * Looks up and deletes (single-use) the auth token matching `raw` + `type`.
 * Returns the associated admin user id, or null if the token is missing,
 * of the wrong type, or expired.
 */
export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType
): Promise<{ adminUserId: string } | null> {
  const record = await prisma.authToken.findUnique({ where: { token: hashToken(raw) } });
  if (!record || record.type !== type || record.expiresAt < new Date()) {
    return null;
  }
  await prisma.authToken.delete({ where: { id: record.id } });
  return { adminUserId: record.adminUserId };
}
