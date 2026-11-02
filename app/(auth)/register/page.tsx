import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_components/auth-shell";
import { RegisterForm } from "../_components/register-form";
import { safeCallbackUrl } from "../_components/callback";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free Shoowflix account to save films and resume them on any device.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ callbackUrl?: string | string[] }>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl);

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <AuthShell
      caption="Every good list starts with one film."
      sub="Save what you want to watch, pick up where you stopped, and take it all from phone to TV."
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
