"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  rootMargin?: string;
  threshold?: number | number[];
  /** Stop observing after the first intersection. */
  once?: boolean;
  /** Skip observing entirely (e.g. when there is nothing more to load). */
  disabled?: boolean;
}

/**
 * IntersectionObserver as a callback ref.
 * `const [ref, inView] = useInView({ rootMargin: "600px" })` then `<div ref={ref} />`.
 */
export function useInView<T extends Element = HTMLDivElement>({
  rootMargin = "0px",
  threshold = 0,
  once = false,
  disabled = false,
}: Options = {}): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<T | null>(null);
  const seen = useRef(false);

  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (!node || disabled || (once && seen.current)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setInView(visible);
        if (visible && once) {
          seen.current = true;
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node, rootMargin, threshold, once, disabled]);

  return [ref, inView];
}
