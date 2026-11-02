"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cx } from "@/lib/movie-utils";
import styles from "./watchlist-button.module.css";

export interface WatchlistButtonProps {
  movieId: number;
  /** "icon": round icon button (cards, overlays). "full": icon + label (detail pages). */
  variant?: "icon" | "full";
  size?: ButtonSize;
  /** Visual style; defaults to glass for icon (sits on imagery) and secondary for full. */
  tone?: ButtonVariant;
  /** Used in the accessible label, e.g. "Add Dune to My List". */
  title?: string;
  className?: string;
}

export function WatchlistButton({ movieId, variant = "full", size = "md", tone, title, className }: WatchlistButtonProps) {
  const { has, toggle } = useWatchlist();
  const [touched, setTouched] = useState(false);
  const saved = has(movieId);
  const label = saved ? "In My List" : "Add to My List";
  // Toggle buttons keep a stable name; state is conveyed by aria-pressed.
  const a11y = title ? `Add ${title} to My List` : "Add to My List";
  const Icon = saved ? Check : Plus;

  return (
    <Button
      variant={tone ?? (variant === "icon" ? "glass" : "secondary")}
      size={size}
      icon={variant === "icon"}
      aria-pressed={variant === "icon" ? saved : undefined}
      aria-label={variant === "icon" ? a11y : undefined}
      title={variant === "icon" ? (saved ? "In My List" : "Add to My List") : undefined}
      className={cx(styles.button, saved && styles.saved, className)}
      onClick={(e) => {
        // Cards wrap buttons in links; never let a toggle navigate.
        e.preventDefault();
        e.stopPropagation();
        setTouched(true);
        void toggle(movieId);
      }}
    >
      <Icon key={saved ? "saved" : "add"} className={touched ? styles.icon : undefined} aria-hidden />
      {variant === "full" ? <span>{label}</span> : null}
    </Button>
  );
}
