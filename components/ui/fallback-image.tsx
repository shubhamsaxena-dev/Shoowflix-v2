"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./fallback-image.module.css";

type Props = ImageProps & {
  /** Rendered in place of the image when it is missing or fails to load. */
  fallback?: ReactNode;
  /**
   * Fade the image in once decoded so posters don't pop. Turn off for the LCP image:
   * an element at opacity 0 doesn't count as painted, which delays LCP.
   */
  fade?: boolean;
};

/**
 * next/image with a designed fallback and a load-in fade.
 * Handles images that finished (or failed) before hydration, where React never sees onLoad/onError.
 */
export function FallbackImage({ fallback = null, fade = true, className, onLoad, onError, src, alt, ...rest }: Props) {
  const key = typeof src === "string" ? src : "static";
  const [state, setState] = useState<{ key: string; status: "loading" | "loaded" | "failed" }>({
    key,
    status: "loading",
  });
  const status = state.key === key ? state.status : "loading";
  const ref = useRef<HTMLImageElement>(null);

  const settle = useCallback((next: "loaded" | "failed") => setState({ key, status: next }), [key]);

  useEffect(() => {
    const img = ref.current;
    if (img?.complete) settle(img.naturalWidth > 0 ? "loaded" : "failed");
  }, [settle]);

  if (!src || status === "failed") return <>{fallback}</>;

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      className={cx(fade && styles.fade, className)}
      data-loaded={status === "loaded" || undefined}
      onLoad={(e) => {
        settle("loaded");
        onLoad?.(e);
      }}
      onError={(e) => {
        settle("failed");
        onError?.(e);
      }}
      {...rest}
    />
  );
}
