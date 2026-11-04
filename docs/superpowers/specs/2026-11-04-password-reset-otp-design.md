# Password reset with email OTP — design

Date: 2026-11-04 · Status: approved, implemented

## Goal

A user who forgot their password can set a new one with a 6-digit code sent to their email,
without help from anyone and without the form revealing which emails have accounts.

## Decisions

| Topic | Decision |
|---|---|
| Email provider | Resend free plan (about 3,000/month and 100/day; one verified domain), called with `fetch` on its REST API (no SDK dependency) |
| Code | 6 random digits (`crypto.randomInt`), valid 10 minutes |
| Storage | SHA-256 hash of the code only; plaintext never stored or logged in production |
| One code per email | Requesting a new code deletes the previous one |
| Wrong guesses | Code deleted after 5 failed attempts |
| Google-only accounts | Allowed: reset sets their first password, so they can also sign in by email |
| After reset | Every code for that email deleted, then the user is signed in and sent to `/` |
| Unknown email | Same 200 "If an account exists…" reply as a real one (no account enumeration) |

## User flow — `/forgot-password` (one page, three client-side steps)

1. **Email.** Enter email → `POST /api/auth/forgot-password` → step 2 with
   "If an account exists for that email, we've sent a 6-digit code."
2. **Code.** Six single-digit PIN boxes (`pin-input.tsx`): typing advances, Backspace goes
   back, arrows move, paste and `autoComplete="one-time-code"` fill all six. A full code
   submits itself → `POST /api/auth/verify-otp`. "Resend code" unlocks after 30 s.
3. **New password.** New password + confirm (must match, min 8) →
   `POST /api/auth/reset-password` with the reset token from step 2. Then sign in with the
   new password and go to `returnTo`.

Entry points:
- Sign-in form: "Forgot password?" next to the password label, carrying the typed email.
- Profile: a "Password" section with "Reset password" (or "Set a password" for Google-only
  accounts) linking to `/forgot-password`. Signed in, the page locks the email to the
  account's and returns to `/profile` at the end.

## Data — new Prisma model

```prisma
model PasswordResetOtp {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique          // one live code per email
  codeHash  String
  resetTokenHash String?           // set once the code is verified
  attempts  Int      @default(0)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("password_reset_otps")
}
```

```prisma
model PasswordResetRequest {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String
  createdAt DateTime @default(now()) @map("created_at")
  @@index([email, createdAt])
  @@map("password_reset_requests")
}
```

Expired rows are deleted by MongoDB through a TTL index on `expires_at`
(`expireAfterSeconds: 0`). Prisma cannot declare TTL indexes, so a one-off script
`scripts/create-otp-ttl-index.mjs` creates it (idempotent), run after `npm run db:push`.
Expiry is also checked in code, since the TTL sweep runs only about once a minute.

## API

### `POST /api/auth/forgot-password` — body `{ email }`

1. zod-validate; lower-case the email.
2. Limits, all checked before the account lookup and answering
   `429 { message, retryAfter }` the same for any email, so they reveal nothing:
   - 10 per IP per 15 min (in-memory `limitRequest`);
   - 1 code per email per 30 s (in-memory, matches the form's resend timer);
   - **5 codes per email in any rolling 24 h**, stored in MongoDB
     (`PasswordResetRequest`, one row per request, TTL-deleted after 24 h) so it holds
     across serverless instances and deploys. Requests for emails without an account
     count too.
3. If a user with that email exists: new code, upsert the row (new hash,
   `resetTokenHash: null`, `attempts: 0`, `expiresAt: now + 10 min`), send the email.
4. `200 { ok: true }` whether or not the account exists. A send failure returns 500;
   the Resend free-plan daily cap (429 from Resend) is logged as
   `[email] Resend daily quota reached` and returns 503.

### `POST /api/auth/verify-otp` — body `{ email, code }`

1. Rate limit 10 per IP per 15 min.
2. Row missing, expired, or already verified → `400 "That code is wrong or has expired."`
3. Constant-time compare. Wrong → `attempts + 1`, message says how many tries are left;
   at 5 the row is deleted and the reply carries `expired: true` (form returns to step 1).
4. Right → claim the code atomically (`updateMany` on `codeHash` + `resetTokenHash: null`),
   store the SHA-256 of a fresh 32-byte reset token, extend expiry 10 min, and return
   `{ ok: true, token }`. The code can't be used again.

### `POST /api/auth/reset-password` — body `{ email, token, password }`

1. Rate limit 10 per IP per 15 min.
2. Row missing, expired, or token mismatch → `400 { expired: true }`.
3. Claim the row (`deleteMany` on the token hash), bcrypt the password (cost 12) and set
   it on the user. `200 { ok: true }`.

Existing sessions are JWTs with no server-side revocation, so other devices stay signed
in until their token expires. Out of scope here (see below).

## Email — `lib/server/email.ts`

- `sendEmail({ to, subject, html, text })` → `POST https://api.resend.com/emails` with
  `Authorization: Bearer ${RESEND_API_KEY}`, 10 s timeout.
- `sendPasswordResetCode(email, code)` builds a short dark-themed HTML email (inline CSS,
  big monospace code, "expires in 10 minutes", "ignore this if it wasn't you") plus a
  plain-text version.
- No `RESEND_API_KEY` in development → log `[email:dev] reset code for x@y: 123456`
  instead of sending. In production a missing key is an error.

Env vars (added to `.env.example` and README): `RESEND_API_KEY`,
`EMAIL_FROM` (`Shoowflix <noreply@shoowflix.com>`; Resend's
`onboarding@resend.dev` works for testing to your own address only).

## Files

- `prisma/schema.prisma` — `PasswordResetOtp` model
- `scripts/create-otp-ttl-index.mjs` — TTL index
- `lib/server/email.ts` — Resend client + reset email template
- `lib/server/otp.ts` — generate, hash, verify helpers
- `lib/server/schemas.ts` — `forgotPasswordSchema`, `resetPasswordSchema`
- `app/api/auth/forgot-password/route.ts`, `verify-otp/route.ts`, `reset-password/route.ts`
- `app/(auth)/forgot-password/page.tsx` + `_components/forgot-password-form.tsx`
  (uses `AuthShell`, `PasswordInput` and `auth.module.css`)
- `app/(auth)/_components/pin-input.tsx` — 6-box code input
- `app/(auth)/_components/signin-form.tsx` — "Forgot password?" link
- `app/profile/page.tsx` — Password section
- `.env.example`, `README.md`

The `[...nextauth]` catch-all stays unaffected: static segments
(`forgot-password`, `reset-password`) win over the catch-all in the App Router.

## Testing

No test framework in the repo, so verification is end-to-end against the dev server
with the console-logged code:

- Happy path: request → code in log → reset → sign in with the new password works,
  the old one doesn't.
- Unknown email returns the same 200 and sends nothing.
- Wrong code ×5 deletes the code; the 6th try with the right code fails.
- Expired code (row with `expiresAt` in the past) is rejected.
- Rate limits return 429 / silent no-send as specified.
- `tsc`, `eslint` pass; the page works at phone width.

## Out of scope

- Signing out other devices after a reset (needs a session version on the JWT).
- Email verification at sign-up and other transactional emails (the email module makes
  them easy later).
- Distributed rate limiting (the existing in-memory limiter is per instance).
