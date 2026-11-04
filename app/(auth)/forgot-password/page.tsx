import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "../_components/auth-shell";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Get a code by email and choose a new Shoowflix password.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ email?: string | string[] }>;

/**
 * Signed out: "Forgot password?" from sign-in. Signed in: "Reset password" from the profile,
 * with the account's own email locked in and a return to /profile at the end.
 */
export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const session = await auth();

  let lockedEmail: string | null = null;
  let hasPassword = true;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, password: true },
    });
    lockedEmail = user?.email ?? null;
    hasPassword = Boolean(user?.password);
  }

  const initialEmail = lockedEmail ?? (typeof sp.email === "string" ? sp.email.slice(0, 254) : "");

  return (
    <AuthShell
      caption="Intermission. Back in a minute."
      sub="We'll email you a 6-digit code. Enter it, choose a new password, and you're back in your seat."
    >
      <ForgotPasswordForm
        initialEmail={initialEmail}
        locked={Boolean(lockedEmail)}
        hasPassword={hasPassword}
        returnTo={lockedEmail ? "/profile" : "/"}
      />
    </AuthShell>
  );
}
