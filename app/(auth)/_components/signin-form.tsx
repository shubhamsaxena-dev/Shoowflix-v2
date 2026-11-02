"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { CircleAlert, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { authErrorMessage } from "./callback";
import styles from "./auth.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"email" | "password", string>>;

function validate(email: string, password: string): Errors {
  const errors: Errors = {};
  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter an email like name@example.com.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function SignInForm({ callbackUrl, initialError }: { callbackUrl: string; initialError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const next = validate(email.trim(), password);
    setErrors(next);
    if (Object.keys(next).length) {
      const firstInvalid = e.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`);
      firstInvalid?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });
    if (!res || res.error) {
      setPending(false);
      setFormError(authErrorMessage(res?.error ?? "Default"));
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  };

  const revalidate = (nextEmail: string, nextPassword: string) => {
    if (submitted) setErrors(validate(nextEmail.trim(), nextPassword));
  };

  const registerHref = callbackUrl === "/" ? "/register" : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.lede}>Sign in to pick up where you left off and keep My List in sync.</p>

      {formError ? (
        <div className={styles.alert} role="alert">
          <CircleAlert aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className={styles.providers}>
        <GoogleButton callbackUrl={callbackUrl} label="Continue with Google" />
      </div>

      <div className={styles.divider}>or sign in with email</div>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Field label="Email" error={errors.email}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            leading={<Mail />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              revalidate(e.target.value, password);
            }}
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              revalidate(email, e.target.value);
            }}
          />
        </Field>
        <Button type="submit" size="lg" block loading={pending} className={styles.submit}>
          Sign in
        </Button>
      </form>

      <p className={styles.switch}>
        New to Shoowflix? <Link href={registerHref}>Create an account</Link>
      </p>
    </>
  );
}
