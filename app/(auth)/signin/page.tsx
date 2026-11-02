import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_components/auth-shell";
import { SignInForm } from "../_components/signin-form";
import { authErrorMessage, safeCallbackUrl } from "../_components/callback";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Shoowflix to keep My List and your progress in sync.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl);

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <AuthShell
      caption="Lights down. Your seat is waiting."
      sub="Thousands of films, streamed the moment you press play. Sign in to keep your list and progress with you."
    >
      <SignInForm callbackUrl={callbackUrl} initialError={authErrorMessage(sp.error)} />
    </AuthShell>
  );
}
