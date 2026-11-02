import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./chip.module.css";

type ChipSize = "sm" | "md";

export interface ChipProps extends Omit<ComponentProps<"button">, "onChange"> {
  /** Toggle state, exposed as aria-pressed. Omit for a plain (non-toggle) chip button. */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  icon?: ReactNode;
  size?: ChipSize;
}

/** Toggle pill (aria-pressed). Use in client components — pass onPressedChange or onClick. */
export function Chip({ pressed, onPressedChange, onClick, icon, size = "md", className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(styles.chip, size === "sm" && styles.sm, className)}
      onClick={(e) => {
        onClick?.(e);
        if (pressed !== undefined) onPressedChange?.(!pressed);
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export interface ChipLinkProps extends ComponentProps<typeof Link> {
  /** Marks the chip as the current page/filter (aria-current). */
  active?: boolean;
  icon?: ReactNode;
  size?: ChipSize;
}

/** Same look as Chip, as a navigation link (server-renderable). */
export function ChipLink({ active, icon, size = "md", className, children, ...rest }: ChipLinkProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cx(styles.chip, size === "sm" && styles.sm, className)}
      {...rest}
    >
      {icon}
      {children}
    </Link>
  );
}
