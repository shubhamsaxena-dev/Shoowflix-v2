import "server-only";
import { SITE_NAME, SITE_URL } from "@/lib/movie-utils";
import { OTP } from "./otp";

/**
 * Transactional email through Resend's REST API (https://resend.com/docs/api-reference).
 * Free plan: 3,000 emails/month, 100/day. Over the daily cap Resend answers 429.
 *
 * Without RESEND_API_KEY in development, emails are printed to the server console instead,
 * so the flow can be tested locally. In production a missing key is an error.
 */

export class EmailQuotaError extends Error {
  constructor() {
    super("Resend daily quota reached");
    this.name = "EmailQuotaError";
  }
}

type Email = { to: string; subject: string; html: string; text: string };

const TIMEOUT_MS = 10_000;

export async function sendEmail({ to, subject, html, text }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <noreply@shoowflix.com>`;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.warn(`[email:dev] to ${to} — ${subject}\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (res.status === 429) throw new EmailQuotaError();
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

export function sendPasswordResetCode(to: string, code: string): Promise<void> {
  const minutes = OTP.ttlMs / 60_000;
  const subject = `${code} is your ${SITE_NAME} reset code`;
  const text = [
    `Your ${SITE_NAME} password reset code is ${code}.`,
    "",
    `It expires in ${minutes} minutes. Enter it on the reset page to choose a new password.`,
    "",
    "If you didn't ask to reset your password, ignore this email. Your password won't change.",
    "",
    SITE_URL,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0b0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e9eaf2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d1a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#12152b;border-radius:16px;padding:32px;">
            <tr><td style="font-size:20px;font-weight:700;letter-spacing:0.02em;color:#ffffff;">${SITE_NAME}</td></tr>
            <tr><td style="padding-top:24px;font-size:16px;line-height:1.5;">Use this code to reset your password:</td></tr>
            <tr>
              <td style="padding:20px 0;">
                <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#ffffff;background:#1c2040;border-radius:12px;padding:16px 0;text-align:center;">${code}</div>
              </td>
            </tr>
            <tr><td style="font-size:14px;line-height:1.5;color:#a9acc4;">It expires in ${minutes} minutes. If you didn't ask to reset your password, ignore this email. Your password won't change.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail({ to, subject, html, text });
}
