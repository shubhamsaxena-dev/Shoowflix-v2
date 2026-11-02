"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ExternalLink } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { PlayerStage, type PlayerStageProps } from "./player-stage";
import { sourceLabel } from "./format";
import { webtorPageUrl } from "./webtor-sdk";
import styles from "./embed-gate.module.css";

/**
 * Webtor's player runs in a cross-site iframe and needs its own cookie for a CSRF check.
 * Safari (and so every iOS browser, which all use WebKit) and Brave block cookies in
 * cross-site iframes, so the embed only ever shows "CSRF token mismatch". On those browsers
 * we skip the embed and send people to webtor.io, where the cookie is first-party.
 */
function embedCookiesBlocked(): boolean {
  const nav = navigator as Navigator & { brave?: unknown };
  const ua = nav.userAgent;
  const iOS = /iP(hone|od|ad)/.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  const safari = /Safari\//.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|Android)\//.test(ua);
  return iOS || safari || "brave" in nav;
}

const noSubscribe = () => () => {};

export function WatchPlayer(props: PlayerStageProps) {
  // null on the server and during hydration, so neither the iframe nor the notice flashes.
  const detected = useSyncExternalStore(noSubscribe, embedCookiesBlocked, () => null);
  const [forceEmbed, setForceEmbed] = useState(false);
  const blocked = forceEmbed ? false : detected;

  if (blocked === null) return <div className={styles.placeholder} aria-busy="true" />;
  if (!blocked) return <PlayerStage {...props} />;
  return <OpenOnWebtor {...props} onTryEmbed={() => setForceEmbed(true)} />;
}

function OpenOnWebtor({
  movie,
  sources,
  initialHash,
  onTryEmbed,
}: PlayerStageProps & { onTryEmbed: () => void }) {
  const best = sources.find((s) => s.hash === initialHash) ?? sources[0]!;
  const others = sources.filter((s) => s.hash !== best.hash);

  return (
    <section className={styles.wrap} aria-labelledby="open-webtor-title">
      <h1 id="open-webtor-title" className={styles.title}>
        Watch {movie.title} on webtor.io
      </h1>
      <p className={styles.body}>
        This browser blocks the cookies the built-in player needs, so it can&rsquo;t play here. Webtor&rsquo;s own
        site streams the same release.
      </p>

      <div className={styles.actions}>
        <a
          href={webtorPageUrl(best.hash)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ variant: "primary" })}
        >
          <ExternalLink size={16} aria-hidden /> Open {sourceLabel(best)} on webtor.io
        </a>
        <Link href={movie.href} className={buttonClass({ variant: "ghost" })}>
          Back to the film
        </Link>
      </div>

      {others.length > 0 ? (
        <div className={styles.others}>
          <p className={styles.label}>Other qualities</p>
          <ul role="list" className={styles.list}>
            {others.map((s) => (
              <li key={s.hash}>
                <a href={webtorPageUrl(s.hash)} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {sourceLabel(s)} <span className={styles.meta}>{s.size}, {s.seeds} seeds</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button variant="ghost" onClick={onTryEmbed} className={styles.retry}>
        Try the built-in player anyway
      </Button>
    </section>
  );
}
