import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "glass" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square icon-only button. Always pass aria-label. */
  icon?: boolean;
  block?: boolean;
  loading?: boolean;
}

export function buttonClass({ variant = "primary", size = "md", icon, block }: StyleProps = {}, extra?: string) {
  return cx(
    styles.button,
    styles[variant],
    size !== "md" && styles[size],
    icon && styles.icon,
    block && styles.block,
    extra,
  );
}

type ButtonProps = StyleProps & ComponentProps<"button"> & { children?: ReactNode };

export function Button({ variant, size, icon, block, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, icon, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = StyleProps & ComponentProps<typeof Link>;

export function ButtonLink({ variant, size, icon, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, icon, block }, className)} {...rest} />;
}
