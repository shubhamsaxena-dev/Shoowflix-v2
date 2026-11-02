"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WEBTOR_SDK_INTEGRITY, WEBTOR_SDK_URL } from "@/components/player/webtor-sdk";

/**
 * Warms the player on intent. The first time someone hovers, focuses or touches any
 * link to /watch/*, we open the connections the player needs, pull the Webtor SDK into
 * the HTTP cache, and prefetch that watch route — so pressing Play skips those round trips.
 * One delegated listener for the whole app; does nothing until a watch link is approached.
 * Only for signed-in members, since /watch requires an account.
 */
export function PlayerWarmup() {
  const router = useRouter();
  // Signed-out visitors are sent to sign in, not the player — nothing to warm.
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    let warmed = false;
    const prefetched = new Set<string>();

    const addLink = (attrs: Record<string, string>) => {
      const link = document.createElement("link");
      for (const [k, v] of Object.entries(attrs)) link.setAttribute(k, v);
      document.head.appendChild(link);
    };

    const warm = () => {
      if (warmed) return;
      warmed = true;
      addLink({ rel: "preconnect", href: "https://webtor.io" });
      addLink({ rel: "preconnect", href: "https://cdn.jsdelivr.net", crossorigin: "anonymous" });
      // Same crossorigin + integrity as the player's <script>, so the cached response is reused.
      addLink({
        rel: "preload",
        as: "script",
        href: WEBTOR_SDK_URL,
        crossorigin: "anonymous",
        integrity: WEBTOR_SDK_INTEGRITY,
      });
    };

    const onIntent = (event: Event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href^="/watch/"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      warm();
      const href = anchor.getAttribute("href");
      if (href && !prefetched.has(href)) {
        prefetched.add(href);
        router.prefetch(href);
      }
    };

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    document.addEventListener("pointerover", onIntent, opts);
    document.addEventListener("focusin", onIntent, opts);
    document.addEventListener("touchstart", onIntent, opts);
    return () => {
      document.removeEventListener("pointerover", onIntent, opts);
      document.removeEventListener("focusin", onIntent, opts);
      document.removeEventListener("touchstart", onIntent, opts);
    };
  }, [router, status]);

  return null;
}
