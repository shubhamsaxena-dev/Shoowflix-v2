import type { ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./badge.module.css";

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: "default" | "accent" | "signal" | "solid" | "rating";
  className?: string;
  children: ReactNode;
}) {
  return <span className={cx(styles.badge, tone !== "default" && styles[tone], className)}>{children}</span>;
}
