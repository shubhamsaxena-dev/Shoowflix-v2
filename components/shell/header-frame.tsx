"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The only stateful part of the header: flips `data-scrolled` once the page moves,
 * so CSS can turn the transparent overlay header solid. Children stay server-rendered.
 */
export function HeaderFrame({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = window.scrollY > 8;
      if (scrolled !== el.hasAttribute("data-scrolled")) el.toggleAttribute("data-scrolled", scrolled);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header ref={ref} className={className}>
      {children}
    </header>
  );
}
