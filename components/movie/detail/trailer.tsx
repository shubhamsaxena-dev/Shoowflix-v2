"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import styles from "./detail.module.css";

/**
 * Lite YouTube facade: a static thumbnail button. No YouTube JS, cookies or iframe
 * until the viewer asks for it; then a nocookie embed is injected with autoplay.
 */
export function Trailer({ code, title }: { code: string; title: string }) {
  const [active, setActive] = useState(false);
  const id = encodeURIComponent(code);

  return (
    <div className={styles.trailerFrame}>
      {active ? (
        <iframe
          className={styles.trailerIframe}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={`${title} — trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          className={styles.trailerFacade}
          onClick={() => setActive(true)}
          onPointerEnter={warmConnections}
          onFocus={warmConnections}
          aria-label={`Play trailer for ${title}`}
        >
          {/* ytimg isn't an optimizer host; the thumbnail is already a small JPEG. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className={styles.trailerThumb}
          />
          <span className={styles.trailerPlay} aria-hidden>
            <Play fill="currentColor" />
          </span>
          <span className={styles.trailerLabel}>Watch the trailer</span>
        </button>
      )}
    </div>
  );
}

let warmed = false;
/** Preconnect on intent so the iframe starts faster without loading anything up front. */
function warmConnections() {
  if (warmed) return;
  warmed = true;
  for (const href of ["https://www.youtube-nocookie.com", "https://www.google.com", "https://i.ytimg.com"]) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    document.head.append(link);
  }
}
