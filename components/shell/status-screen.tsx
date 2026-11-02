import type { ReactNode } from "react";
import { FilmLeader } from "./film-leader";
import styles from "./status-screen.module.css";

/** Shared layout for not-found / error screens: film leader + headline + actions. */
export function StatusScreen({
  code,
  numeral,
  title,
  description,
  actions,
  headingLevel = 1,
}: {
  /** Small technical line, e.g. "Error 404". */
  code?: string;
  numeral?: string | number;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={`container ${styles.screen}`}>
      <FilmLeader numeral={numeral} size="lg" className={styles.leader} />
      <div className={styles.copy}>
        {code ? <p className={styles.code}>{code}</p> : null}
        <Heading className={styles.title}>{title}</Heading>
        {description ? <p className={styles.description}>{description}</p> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </section>
  );
}
