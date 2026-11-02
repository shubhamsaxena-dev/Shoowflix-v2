import Image from "next/image";
import type { ReactNode } from "react";
import { listMovies } from "@/lib/yts";
import type { YTSMovie } from "@/types/movie";
import styles from "./auth.module.css";

const STRIPS = 3;
const PER_STRIP = 6;

async function getPosters(): Promise<YTSMovie[]> {
  try {
    const { movies } = await listMovies({ sort_by: "download_count", minimum_rating: 7, limit: STRIPS * PER_STRIP });
    return (movies ?? []).filter((m) => m.medium_cover_image);
  } catch {
    return [];
  }
}

/**
 * Split-screen auth layout: a drifting contact sheet of film strips on one side
 * (decorative, desktop only), the form on the other.
 */
export async function AuthShell({ caption, sub, children }: { caption: ReactNode; sub: ReactNode; children: ReactNode }) {
  const posters = await getPosters();
  const strips = Array.from({ length: STRIPS }, (_, s) => {
    const own = posters.filter((_, i) => i % STRIPS === s);
    return own.length ? own : Array.from({ length: PER_STRIP }, () => null);
  });

  return (
    <div className={styles.page}>
      <aside className={styles.collage} aria-hidden>
        <div className={styles.strips}>
          {strips.map((frames, s) => (
            <div key={s} className={styles.strip}>
              {/* Rendered twice so the drift loops seamlessly. */}
              <div className={styles.reel}>
                {[...frames, ...frames].map((m, i) => (
                  <div key={i} className={styles.frame}>
                    {m ? (
                      <Image
                        src={m.medium_cover_image}
                        alt=""
                        fill
                        sizes="(min-width: 960px) 14vw, 1px"
                        quality={60}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.beam} />
        <div className={styles.caption}>
          <p className={styles.captionLine}>{caption}</p>
          <p className={styles.captionSub}>{sub}</p>
        </div>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.card}>{children}</div>
      </div>
    </div>
  );
}
