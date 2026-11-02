"use client";

import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const PX: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 56, xl: 96 };

export function initials(name?: string | null, email?: string | null): string {
  const source = (name || email?.split("@")[0] || "").trim();
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export interface AvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

/** Round avatar; falls back to initials when there is no image or it fails to load. */
export function Avatar({ name, email, src, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const px = PX[size];
  const label = name || email || "User";
  return (
    <span className={cx(styles.avatar, styles[size], className)} title={label}>
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          className={styles.image}
          unoptimized
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.initials} aria-hidden>
          {initials(name, email)}
        </span>
      )}
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
