import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * The short code a tenant writes in their bank-transfer note, so the platform
 * owner can match an incoming payment to the right account alongside the
 * business name. e.g. "NY-7KQ3MP".
 *
 * Leaves out characters that are easy to mix up when read off a bank
 * statement or typed on a phone (0/O, 1/I/L).
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 6;

export function generatePaymentReference(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `NY-${code}`;
}

/**
 * Returns the tenant's reference, creating one if they predate references.
 * Signup assigns one up front; this covers older tenants the first time
 * anyone needs to see theirs.
 */
export async function ensurePaymentReference(tenant: {
  id: string;
  paymentReference: string | null;
}): Promise<string> {
  if (tenant.paymentReference) return tenant.paymentReference;
  // ~887 million codes, so a clash is vanishingly unlikely — but the column
  // is unique, so retry rather than surface a constraint error if it happens.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generatePaymentReference();
    try {
      const updated = await prisma.tenant.updateMany({
        where: { id: tenant.id, paymentReference: null },
        data: { paymentReference: reference },
      });
      if (updated.count === 0) {
        // Someone else assigned one between our read and write — use theirs.
        const current = await prisma.tenant.findUnique({
          where: { id: tenant.id },
          select: { paymentReference: true },
        });
        if (current?.paymentReference) return current.paymentReference;
      } else {
        return reference;
      }
    } catch {
      // Unique clash — try another code.
    }
  }
  throw new Error("Couldn't assign a payment reference");
}
