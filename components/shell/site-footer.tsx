import Link from "next/link";
import { Wordmark } from "./wordmark";
import styles from "./site-footer.module.css";

const LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/my-list", label: "My List" },
  { href: "/profile", label: "Profile" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <Link href="/" className={styles.brand} aria-label="Shoowflix home">
            <Wordmark size="sm" />
          </Link>
          <nav aria-label="Footer">
            <ul role="list" className={styles.links}>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={styles.link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <section className={styles.notice} aria-labelledby="footer-notice">
          <h2 id="footer-notice" className={styles.noticeTitle}>
            About the films on Shoowflix
          </h2>
          <p>
            Shoowflix doesn&rsquo;t host, store or distribute any media. Films are streamed from public peer-to-peer
            networks and third-party sources, and this site is a non-commercial project made for learning and
            demonstration. You&rsquo;re responsible for following the copyright rules where you live. Questions about
            a specific title belong with the source that publishes it.
          </p>
        </section>

        <p className={styles.legal}>
          <span>© {year} Shoowflix</span>
          <span>Film data from YTS. Not affiliated with any studio or streaming service.</span>
        </p>
      </div>
    </footer>
  );
}
