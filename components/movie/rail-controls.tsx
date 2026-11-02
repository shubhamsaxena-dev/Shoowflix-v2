"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./movie-rail.module.css";

/** Tiny island: pages a server-rendered scroll-snap track by ~one viewport. */
export function RailControls({ trackId, label }: { trackId: string; label: string }) {
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const track = document.getElementById(trackId);
    if (!track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = track.scrollWidth - track.clientWidth;
        setEdges({ start: track.scrollLeft <= 4, end: track.scrollLeft >= max - 4 });
      });
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [trackId]);

  const page = (dir: 1 | -1) => {
    const track = document.getElementById(trackId);
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.control}
        onClick={() => page(-1)}
        disabled={edges.start}
        aria-controls={trackId}
        aria-label={`Scroll ${label} back`}
      >
        <ChevronLeft aria-hidden />
      </button>
      <button
        type="button"
        className={styles.control}
        onClick={() => page(1)}
        disabled={edges.end}
        aria-controls={trackId}
        aria-label={`Scroll ${label} forward`}
      >
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}
