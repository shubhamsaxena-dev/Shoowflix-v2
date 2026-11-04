import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CACHE, json, jsonError, parseBody, serverError } from "@/lib/server/http";
import { otpMatches } from "@/lib/server/otp";
import { limitRequest } from "@/lib/server/rate-limit";
import { resetPasswordSchema } from "@/lib/server/schemas";

const EXPIRED = "Your reset session has expired. Start again to get a new code.";

/**
 * Step 3 of password reset: set the new password, using the token from /verify-otp.
 * Works for Google-only accounts too, which then gain an email + password sign-in.
 */
export async function POST(req: Request) {
  const limited = limitRequest(req, "reset-password", { limit: 10, windowMs: 15 * 60_000 });
  if (limited) return limited;

  const body = await parseBody(req, resetPasswordSchema);
  if (!body.ok) return body.response;
  const { email, token, password } = body.data;

  try {
    const otp = await prisma.passwordResetOtp.findUnique({ where: { email } });
    if (!otp || otp.expiresAt.getTime() <= Date.now() || !otpMatches(token, otp.resetTokenHash)) {
      return jsonError(400, EXPIRED, { expired: true });
    }

    // Claim the token before using it, so two concurrent requests can't both spend it.
    const claimed = await prisma.passwordResetOtp.deleteMany({ where: { email, resetTokenHash: otp.resetTokenHash } });
    if (claimed.count === 0) return jsonError(400, EXPIRED, { expired: true });

    const hashed = await bcrypt.hash(password, 12);
    const updated = await prisma.user.updateMany({ where: { email }, data: { password: hashed } });
    if (updated.count === 0) return jsonError(400, EXPIRED, { expired: true });

    return json({ ok: true }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/auth/reset-password]", error);
    return serverError("We couldn't reset your password. Try again in a moment.");
  }
}
