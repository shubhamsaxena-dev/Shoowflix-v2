"use client";

import type { ReactNode } from "react";
import { LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { ButtonLink, type ButtonSize } from "@/components/ui/button";
import { watchHref } from "@/lib/movie-utils";

/**
 * Play/Stream button. Watching needs an account, so signed-out visitors get
 * "Sign in to watch", linking to sign-in with a callback to this film (and quality).
 * Pages using it stay static: the session is read on the client, and the signed-in
 * label is what's server-rendered (proxy.ts still enforces sign-in on /watch).
 */
export function WatchButton({
  movieId,
  quality,
  size = "lg",
  children,
  className,
}: {
  movieId: number;
  quality?: string;
  size?: ButtonSize;
  /** Signed-in content, e.g. <Play /> Play 1080p */
  children: ReactNode;
  className?: string;
}) {
  const { status } = useSession();
  const href = watchHref(movieId, quality);

  if (status === "unauthenticated") {
    return (
      <ButtonLink
        href={`/signin?callbackUrl=${encodeURIComponent(href)}`}
        size={size}
        className={className}
        prefetch={false}
      >
        <LogIn aria-hidden />
        Sign in to watch
        {quality ? <span className="visually-hidden"> in {quality}</span> : null}
      </ButtonLink>
    );
  }

  return (
    <ButtonLink href={href} size={size} className={className} prefetch={false}>
      {children}
    </ButtonLink>
  );
}
