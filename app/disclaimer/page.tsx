import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { safeReturnTo } from "@/lib/disclaimer";
import styles from "./disclaimer.module.css";

export const metadata: Metadata = {
  title: "Before you watch",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The gate every visitor passes through once (enforced in proxy.ts). Plain form, no JS needed.
 * `?declined=1` shows why the site stays closed.
 */
export default async function DisclaimerPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const returnTo = safeReturnTo(first(query.returnTo));
  const declined = first(query.declined) === "1";

  return (
    <div className={styles.gate}>
      <section className={styles.panel} aria-labelledby="disclaimer-title">
        <p className={styles.kicker}>Educational project</p>
        {declined ? (
          <>
            <h1 id="disclaimer-title" className={styles.title}>
              Shoowflix needs your agreement
            </h1>
            <div className={styles.body}>
              <p>You can keep browsing, but streaming on Shoowflix needs you to accept the terms. Nothing has been saved.</p>
            </div>
            <div className={styles.actions}>
              <Link href={`/disclaimer?returnTo=${encodeURIComponent(returnTo)}`} className={buttonClass({ size: "lg" })}>
                Review the terms
              </Link>
              <Link href="/" className={buttonClass({ variant: "ghost", size: "lg" })}>
                Keep browsing
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 id="disclaimer-title" className={styles.title}>
              Before you watch
            </h1>
            <div className={styles.body}>
              <p>
                Shoowflix is an <strong>educational project</strong>, built to learn and demonstrate modern web
                development: Next.js, streaming UIs and peer-to-peer video. It&rsquo;s non-commercial and
                doesn&rsquo;t host, store or upload any films.
              </p>
              <ul>
                <li>Film listings come from the public YTS catalogue. Video streams from peer-to-peer networks through Webtor, a third-party player.</li>
                <li>Copyright law differs by country. You&rsquo;re responsible for what you watch and for following the law where you live.</li>
                <li>Streaming a torrent shares your connection with other peers, and they can see your IP address.</li>
                <li>Nothing here is endorsed by, or affiliated with, any studio or streaming service.</li>
              </ul>
              <p className={styles.confirm}>
                Streaming starts after you agree. By continuing you confirm you&rsquo;ve read this, understand it&rsquo;s an
                educational project, and accept these terms. We&rsquo;ll remember your choice on this device for 24 hours.
              </p>
            </div>
            <form method="post" action="/api/disclaimer" className={styles.actions}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" name="agree" value="yes" className={buttonClass({ size: "lg" })} autoFocus>
                I agree, continue
              </button>
              <Link
                href={`/disclaimer?declined=1&returnTo=${encodeURIComponent(returnTo)}`}
                className={buttonClass({ variant: "ghost", size: "lg" })}
              >
                I don&rsquo;t agree
              </Link>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
