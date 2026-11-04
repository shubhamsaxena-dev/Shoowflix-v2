import { prisma } from "@/lib/prisma";
import { EmailQuotaError, sendPasswordResetCode } from "@/lib/server/email";
import { CACHE, json, jsonError, parseBody, serverError } from "@/lib/server/http";
import { generateOtp, hashOtp, OTP } from "@/lib/server/otp";
import { limitRequest, rateLimit } from "@/lib/server/rate-limit";
import { forgotPasswordSchema } from "@/lib/server/schemas";

const WINDOW_MS = 15 * 60_000;
/** Matches the "Resend in 30s" timer on the form. */
const RESEND_COOLDOWN_MS = 30_000;

function tooMany(message: string, retryAfter: number) {
  const res = jsonError(429, message, { retryAfter });
  res.headers.set("Retry-After", String(retryAfter));
  return res;
}

/**
 * Step 1 of password reset: email a 6-digit code.
 * The reply is the same whether or not the email has an account, so this can't be used
 * to find out who is registered.
 */
export async function POST(req: Request) {
  const limited = limitRequest(req, "forgot-password", { limit: 10, windowMs: WINDOW_MS });
  if (limited) return limited;

  const body = await parseBody(req, forgotPasswordSchema);
  if (!body.ok) return body.response;
  const { email } = body.data;
  const sent = json({ ok: true }, { cache: CACHE.private });

  // Per-email cooldown (one code every 30 s), matching the form's resend timer.
  const cooldown = rateLimit(`forgot-password:cooldown:${email}`, { limit: 1, windowMs: RESEND_COOLDOWN_MS });
  if (!cooldown.ok) return tooMany("Wait a few seconds before requesting another code.", cooldown.retryAfter);

  try {
    // At most 5 codes per account in any 24 hours. Kept in the database (not in memory) so it
    // holds across serverless instances and deploys. Every request counts, account or not,
    // and the check runs before the account lookup, so the reply never reveals who has one.
    const since = new Date(Date.now() - OTP.dailyWindowMs);
    const recent = await prisma.passwordResetRequest.findMany({
      where: { email, createdAt: { gt: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (recent.length >= OTP.dailyLimit) {
      const retryAfter = Math.ceil((recent[0]!.createdAt.getTime() + OTP.dailyWindowMs - Date.now()) / 1000);
      return tooMany(
        `You’ve requested ${OTP.dailyLimit} codes in the last 24 hours. Try again later.`,
        Math.max(1, retryAfter),
      );
    }
    await prisma.passwordResetRequest.create({ data: { email } });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return sent;

    const code = generateOtp();
    const data = {
      codeHash: hashOtp(code),
      resetTokenHash: null,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP.ttlMs),
    };
    // One live code per email: a new request replaces the old code.
    await prisma.passwordResetOtp.upsert({ where: { email }, update: data, create: { email, ...data } });
    await sendPasswordResetCode(email, code);
    return sent;
  } catch (error) {
    if (error instanceof EmailQuotaError) {
      console.error("[email] Resend daily quota reached");
      return jsonError(503, "We can't send codes right now. Try again later.");
    }
    console.error("[api/auth/forgot-password]", error);
    return serverError("We couldn't send the code. Try again in a moment.");
  }
}
