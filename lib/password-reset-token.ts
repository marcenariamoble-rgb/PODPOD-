import { createHash, randomBytes } from "node:crypto";

export function generatePasswordResetSecret(): { raw: string; tokenHash: string } {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(raw);
  return { raw, tokenHash };
}

export function hashPasswordResetToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
