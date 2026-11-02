import Link from "next/link";
import { HeaderFrame } from "./header-frame";
import { Wordmark } from "./wordmark";
import { PrimaryNav } from "./primary-nav";
import { SearchTrigger } from "./search-trigger";
import { UserNav } from "./user-nav";
import styles from "./site-header.module.css";

/**
 * Sticky site header. Server component; interactive bits are small client islands.
 *
 * Overlay mode: any page that renders an element with `data-header-overlay`
 * (e.g. a full-bleed hero) gets a transparent header laid over it, which turns
 * solid once the user scrolls. Pages without it get a solid header in normal flow.
 *
 * Session is read client-side (UserNav) on purpose: calling auth() here would make
 * every route dynamic and defeat SSG/ISR.
 */
export function SiteHeader() {
  return (
    <HeaderFrame className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Shoowflix home">
          <Wordmark />
        </Link>
        <PrimaryNav />
        <div className={styles.actions}>
          <SearchTrigger />
          <UserNav />
        </div>
      </div>
    </HeaderFrame>
  );
}
