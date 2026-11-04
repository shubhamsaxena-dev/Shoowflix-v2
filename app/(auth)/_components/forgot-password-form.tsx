"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { CircleAlert, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "./password-input";
import { PinInput } from "./pin-input";
import styles from "./auth.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const CODE_LENGTH = 6;
const RESEND_AFTER_S = 30;

type Step = "email" | "code" | "password";
type Reply = { ok: boolean; status: number; message?: string; token?: string; expired?: boolean; retryAfter?: number };

async function post(url: string, body: unknown): Promise<Reply> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as Omit<Reply, "ok" | "status"> | null;
    return { ok: res.ok, status: res.status, ...data };
  } catch {
    return { ok: false, status: 0, message: "We couldn’t reach Shoowflix. Check your connection and try again." };
  }
}

function resendLabel(seconds: number): string {
  if (seconds <= 0) return "Resend code";
  if (seconds > 90 * 60) return `Resend in ${Math.ceil(seconds / 3600)} h`;
  if (seconds > 90) return `Resend in ${Math.ceil(seconds / 60)} min`;
  return `Resend in ${seconds}s`;
}

function Alert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className={styles.alert} role="alert">
      <CircleAlert aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function ForgotPasswordForm({
  initialEmail,
  locked,
  hasPassword,
  returnTo,
}: {
  initialEmail: string;
  /** Signed in from the profile: the email is the account's and can't be changed. */
  locked: boolean;
  /** False for Google-only accounts, which are setting their first password. */
  hasPassword: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string>();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const normalizedEmail = email.trim().toLowerCase();
  const verb = hasPassword ? "Reset" : "Set";

  /** Back to step 1 with a reason, e.g. when the code or reset session expired. */
  const restart = (message: string) => {
    setStep("email");
    setCode("");
    setToken("");
    setPassword("");
    setConfirm("");
    setCodeError(undefined);
    setFormError(message);
  };

  const sendCode = async () => {
    setPending(true);
    setFormError(null);
    const res = await post("/api/auth/forgot-password", { email: normalizedEmail });
    setPending(false);
    if (!res.ok) {
      setFormError(res.message ?? "We couldn’t send the code. Try again in a moment.");
      // Keep the timer in step with the server's cooldown when it says to wait.
      if (res.status === 429 && res.retryAfter) setCooldown(res.retryAfter);
      return false;
    }
    setCooldown(RESEND_AFTER_S);
    return true;
  };

  const onEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!normalizedEmail) return setEmailError("Enter your email address.");
    if (!EMAIL_RE.test(normalizedEmail)) return setEmailError("Enter an email like name@example.com.");
    setEmailError(undefined);
    if (await sendCode()) {
      setCode("");
      setCodeError(undefined);
      setStep("code");
    }
  };

  const verifyCode = async (value: string) => {
    if (pending) return;
    if (value.length !== CODE_LENGTH) return setCodeError("Enter all 6 digits.");
    setPending(true);
    setCodeError(undefined);
    setFormError(null);
    const res = await post("/api/auth/verify-otp", { email: normalizedEmail, code: value });
    setPending(false);
    if (res.ok && res.token) {
      setToken(res.token);
      setStep("password");
      return;
    }
    if (res.expired) return restart(res.message ?? "Too many wrong codes. Request a new one.");
    setCode("");
    setCodeError(res.message ?? "That code didn’t work. Try again.");
  };

  const onPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: typeof pwErrors = {};
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (!confirm) next.confirm = "Type the new password again.";
    else if (confirm !== password) next.confirm = "The passwords don’t match.";
    setPwErrors(next);
    if (Object.keys(next).length) {
      e.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    const res = await post("/api/auth/reset-password", { email: normalizedEmail, token, password });
    if (!res.ok) {
      setPending(false);
      if (res.expired) return restart(res.message ?? "Your reset session has expired. Start again.");
      setFormError(res.message ?? "We couldn’t save your password. Try again in a moment.");
      return;
    }

    // Sign in with the new password (also refreshes the session when coming from the profile).
    const signedIn = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: returnTo,
    });
    router.replace(!signedIn || signedIn.error ? "/signin" : returnTo);
    router.refresh();
  };

  const stepLabel = `Step ${step === "email" ? 1 : step === "code" ? 2 : 3} of 3`;

  if (step === "email") {
    return (
      <>
        <p className={styles.steps}>{stepLabel}</p>
        <h1 className={styles.title}>{locked ? `${verb} your password` : "Forgot your password?"}</h1>
        <p className={styles.lede}>
          {locked
            ? "We’ll email a 6-digit code to your account address to confirm it’s you."
            : "Enter the email you use for Shoowflix and we’ll send you a 6-digit code."}
        </p>
        <Alert message={formError} />
        <form className={`${styles.form} ${styles.formSpaced}`} onSubmit={onEmailSubmit} noValidate>
          <Field label="Email" error={emailError}>
            <Input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              leading={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={locked}
              autoFocus={!locked}
            />
          </Field>
          <Button type="submit" size="lg" block loading={pending} className={styles.submit}>
            Send code
          </Button>
        </form>
        <p className={styles.switch}>
          {locked ? (
            <Link href={returnTo}>Back to profile</Link>
          ) : (
            <>
              Remembered it? <Link href="/signin">Back to sign in</Link>
            </>
          )}
        </p>
      </>
    );
  }

  if (step === "code") {
    return (
      <>
        <p className={styles.steps}>{stepLabel}</p>
        <h1 className={styles.title}>Enter the code</h1>
        <div className={styles.notice} role="status">
          <MailCheck aria-hidden />
          <span>
            If an account exists for <strong>{normalizedEmail}</strong>, we’ve sent a 6-digit code. It expires in 10
            minutes.
          </span>
        </div>
        <Alert message={formError} />
        <form
          className={`${styles.form} ${styles.formSpaced}`}
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode(code);
          }}
          noValidate
        >
          <div>
            <PinInput
              length={CODE_LENGTH}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (codeError) setCodeError(undefined);
              }}
              onComplete={(v) => void verifyCode(v)}
              invalid={Boolean(codeError)}
              disabled={pending}
              describedBy={codeError ? "pin-error" : undefined}
              autoFocus
            />
            <div className={styles.pinMeta}>
              {codeError ? (
                <span id="pin-error" className={styles.pinError} role="alert">
                  {codeError}
                </span>
              ) : (
                <span />
              )}
              <button
                type="button"
                className={styles.textButton}
                disabled={pending || cooldown > 0}
                onClick={async () => {
                  if (await sendCode()) {
                    setCode("");
                    setCodeError(undefined);
                  }
                }}
              >
                {resendLabel(cooldown)}
              </button>
            </div>
          </div>
          <Button type="submit" size="lg" block loading={pending} className={styles.submit}>
            Verify code
          </Button>
        </form>
        <p className={styles.switch}>
          {locked ? (
            <Link href={returnTo}>Back to profile</Link>
          ) : (
            <>
              Wrong email?{" "}
              <button type="button" className={styles.textButton} onClick={() => restart("")}>
                Use a different email
              </button>
            </>
          )}
        </p>
      </>
    );
  }

  return (
    <>
      <p className={styles.steps}>{stepLabel}</p>
      <h1 className={styles.title}>{hasPassword ? "Create a new password" : "Create a password"}</h1>
      <p className={styles.lede}>
        Code confirmed. Choose a password for <strong>{normalizedEmail}</strong>.
      </p>
      <Alert message={formError} />
      <form className={`${styles.form} ${styles.formSpaced}`} onSubmit={onPasswordSubmit} noValidate>
        {/* Hidden username so password managers save the new password against the right account. */}
        <input type="email" name="username" autoComplete="username" value={normalizedEmail} readOnly hidden />
        <Field label="New password" hint={`At least ${MIN_PASSWORD} characters.`} error={pwErrors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="Choose a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Confirm new password" error={pwErrors.confirm}>
          <PasswordInput
            name="confirm"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" block loading={pending} className={styles.submit}>
          {verb} password
        </Button>
      </form>
    </>
  );
}
