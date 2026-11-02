import type { ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./discovery.module.css";

/** Editorial page header used by genre, browse and search. */
export function PageIntro({
  kicker,
  title,
  lede,
  aside,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx(styles.intro, className)}>
      <div className={styles.introText}>
        {kicker && <p className={styles.introKicker}>{kicker}</p>}
        <h1 className={styles.introTitle}>{title}</h1>
        {lede && <p className={styles.introLede}>{lede}</p>}
      </div>
      {aside && <div className={styles.introAside}>{aside}</div>}
    </header>
  );
}

export function EmptyState({
  title,
  children,
  actions,
}: {
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyFrame} aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <h2 className={styles.emptyTitle}>{title}</h2>
      {children && <div className={styles.emptyBody}>{children}</div>}
      {actions && <div className={styles.emptyActions}>{actions}</div>}
    </div>
  );
}
