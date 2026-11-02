import type { ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./kbd.module.css";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cx(styles.kbd, className)}>{children}</kbd>;
}
