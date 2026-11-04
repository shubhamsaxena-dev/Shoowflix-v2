import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** Password-reset codes: 6 digits, valid 10 minutes, 5 guesses. */
export const OTP = {
  length: 6,
  ttlMs: 10 * 60_000,
  maxAttempts: 5,
  /** Codes one account can request in any rolling 24 hours. */
  dailyLimit: 5,
  dailyWindowMs: 24 * 60 * 60_000,
} as const;

/** A uniformly random code, zero-padded ("042917"). */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP.length)).padStart(OTP.length, "0");
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Constant-time comparison of a submitted code (or reset token) against the stored hash. */
export function otpMatches(code: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashOtp(code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Handed to the browser after the code checks out; proves the code step for the password step. */
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}
