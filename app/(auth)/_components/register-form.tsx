"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { CircleAlert, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import styles from "./auth.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Values = { name: string; email: string; password: string };
type Errors = Partial<Record<keyof Values, string>>;

function validate({ name, email, password }: Values): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = "Enter your name.";
  else if (name.trim().length > 60) errors.name = "Keep your name under 60 characters.";
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter an email like name@example.com.";
  if (!password) errors.password = "Choose a password.";
  else if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  return errors;
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const update = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length) {
      e.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    const email = values.email.trim().toLowerCase();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: values.name.trim(), email, password: values.password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setFormError(
          body?.message ??
            (res.status === 409
              ? "An account with this email already exists. Sign in instead."
              : "We couldn’t create your account. Try again in a moment."),
        );
        setPending(false);
        return;
      }
    } catch {
      setFormError("We couldn’t reach Shoowflix. Check your connection and try again.");
      setPending(false);
      return;
    }

    const signedIn = await signIn("credentials", { email, password: values.password, redirect: false, callbackUrl });
    if (!signedIn || signedIn.error) {
      // Account exists but auto sign-in failed — send them to sign in manually.
      router.replace(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  };

  const signinHref = callbackUrl === "/" ? "/signin" : `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <>
      <h1 className={styles.title}>Take a seat</h1>
      <p className={styles.lede}>Create an account to save films to My List and resume them on any device.</p>

      {formError ? (
        <div className={styles.alert} role="alert">
          <CircleAlert aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className={styles.providers}>
        <GoogleButton callbackUrl={callbackUrl} label="Sign up with Google" />
      </div>

      <div className={styles.divider}>or sign up with email</div>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Field label="Name" error={errors.name}>
          <Input
            name="name"
            autoComplete="name"
            placeholder="What should we call you?"
            leading={<User />}
            value={values.name}
            onChange={update("name")}
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            leading={<Mail />}
            value={values.email}
            onChange={update("email")}
          />
        </Field>
        <Field label="Password" hint={`At least ${MIN_PASSWORD} characters.`} error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="Choose a password"
            value={values.password}
            onChange={update("password")}
          />
        </Field>
        <Button type="submit" size="lg" block loading={pending} className={styles.submit}>
          Create account
        </Button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link href={signinHref}>Sign in</Link>
      </p>
    </>
  );
}
