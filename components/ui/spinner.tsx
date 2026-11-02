import { cx } from "@/lib/movie-utils";
import styles from "./spinner.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  /** Accessible label. Pass `null` when a parent already announces loading. */
  label?: string | null;
  tone?: "accent" | "signal" | "current";
  className?: string;
}

/** A tiny film reel that turns. */
export function Spinner({ size = "md", label = "Loading", tone = "accent", className }: SpinnerProps) {
  return (
    <span
      className={cx(styles.spinner, styles[size], styles[tone], className)}
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7" r="1.6" fill="currentColor" />
        <circle cx="16.75" cy="13.5" r="1.6" fill="currentColor" />
        <circle cx="7.25" cy="13.5" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}
