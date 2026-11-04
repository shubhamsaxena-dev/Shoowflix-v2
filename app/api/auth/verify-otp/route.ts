import { prisma } from "@/lib/prisma";
import { CACHE, json, jsonError, parseBody, serverError } from "@/lib/server/http";
import { generateResetToken, hashOtp, OTP, otpMatches } from "@/lib/server/otp";
import { limitRequest } from "@/lib/server/rate-limit";
import { verifyOtpSchema } from "@/lib/server/schemas";

const INVALID = "That code is wrong or has expired.";

/**
 * Step 2 of password reset: check the emailed code. On success the code is spent and the
 * browser gets a one-time reset token for step 3, valid for the same 10 minutes.
 */
export async function POST(req: Request) {
  const limited = limitRequest(req, "verify-otp", { limit: 10, windowMs: 15 * 60_000 });
  if (limited) return limited;

  const body = await parseBody(req, verifyOtpSchema);
  if (!body.ok) return body.response;
  const { email, code } = body.data;

  try {
    const otp = await prisma.passwordResetOtp.findUnique({ where: { email } });
    // A verified row (resetTokenHash set) no longer accepts codes. The TTL index only sweeps
    // about once a minute, so check expiry here as well.
    if (!otp || otp.resetTokenHash || otp.expiresAt.getTime() <= Date.now()) return jsonError(400, INVALID);

    if (!otpMatches(code, otp.codeHash)) {
      const left = OTP.maxAttempts - (otp.attempts + 1);
      if (left <= 0) {
        await prisma.passwordResetOtp.delete({ where: { email } }).catch(() => {});
        return jsonError(400, "Too many wrong codes. Request a new one.", { expired: true });
      }
      await prisma.passwordResetOtp.update({ where: { email }, data: { attempts: { increment: 1 } } });
      return jsonError(400, `${INVALID} ${left} ${left === 1 ? "try" : "tries"} left.`);
    }

    const token = generateResetToken();
    // Only one request can spend the code: the filter on codeHash + no token makes it a claim.
    const claimed = await prisma.passwordResetOtp.updateMany({
      where: { email, codeHash: otp.codeHash, resetTokenHash: null },
      data: { resetTokenHash: hashOtp(token), expiresAt: new Date(Date.now() + OTP.ttlMs) },
    });
    if (claimed.count === 0) return jsonError(400, INVALID);

    return json({ ok: true, token }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/auth/verify-otp]", error);
    return serverError("We couldn't check the code. Try again in a moment.");
  }
}
