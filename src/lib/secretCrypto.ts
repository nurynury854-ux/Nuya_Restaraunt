import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * At-rest encryption for third-party credentials a tenant pastes into their
 * own settings (e.g. their Mitake SMS account password, src/lib/sms.ts).
 *
 * These aren't login passwords — they can't be one-way hashed, because the
 * plaintext has to go out over the wire to the third party on every call —
 * but they also shouldn't sit in the database in the clear. AES-256-GCM with
 * a server-only key closes that gap: a database leak alone doesn't expose
 * the credential.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

function getKey(): Buffer {
  const hex = process.env.SECRET_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "SECRET_ENCRYPTION_KEY is not set — generate one with `openssl rand -hex 32` and add it to your environment variables."
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `SECRET_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (${KEY_BYTES * 2} hex characters).`
    );
  }
  return key;
}

/** Encrypts a secret for storage. Returns `iv.authTag.ciphertext`, each base64. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64")).join(".");
}

/** Reverses `encryptSecret`. Throws if the value is malformed or the key is wrong. */
export function decryptSecret(stored: string): string {
  const parts = stored.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted secret — expected iv.authTag.ciphertext");
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
