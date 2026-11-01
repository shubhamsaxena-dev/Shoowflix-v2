import type { CSSProperties } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./skeleton.module.css";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={cx(styles.skeleton, className)} style={style} />;
}
