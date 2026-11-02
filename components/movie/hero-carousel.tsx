"use client";

import { FallbackImage } from "@/components/ui/fallback-image";
import { useEffect, useState } from "react";
import { Info, Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { WatchlistButton } from "@/components/account/watchlist-button";
import { cx, watchHref } from "@/lib/movie-utils";
import styles from "./hero.module.css";

export interface HeroSlide {
  id: number;
  title: string;
  href: string;
  backdrop: string;
  year: number;
  runtime: string;
  rating: string;
  mpa: string;
  genres: string[];
  summary: string;
}

const HERO_SIZES = "(min-width: 1024px) 80vw, 100vw";

/**
 * Rotating spotlight. Slide 0 is the LCP image (preloaded, high priority) and is
 * rendered in the server HTML; other backdrops are only mounted ("primed") once the
 * page has loaded, one slide ahead of the current one, so first paint downloads one image.
 * Auto-advance is driven by the progress bar's CSS animation: hover, focus and
 * prefers-reduced-motion simply pause/disable the animation.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [primed, setPrimed] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const slide = slides[current]!;

  // Prime the next slide after load so rotation never shows an empty frame.
  useEffect(() => {
    if (count < 2) return;
    const next = (current + 1) % count;
    if (primed.has(next)) return;
    const prime = () => setPrimed((p) => new Set(p).add(next));
    if (current === 0 && document.readyState !== "complete") {
      const onLoad = () => window.setTimeout(prime, 1500);
      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    }
    const t = window.setTimeout(prime, 600);
    return () => window.clearTimeout(t);
  }, [current, count, primed]);

  const go = (index: number) => {
    setPrimed((p) => (p.has(index) ? p : new Set(p).add(index)));
    setCurrent(index);
  };

  return (
    <section data-header-overlay=""
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Featured films"
      data-paused={paused || undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className={styles.stage} aria-hidden>
        {slides.map((s, i) =>
          primed.has(i) ? (
            <div key={s.id} className={cx(styles.backdrop, i === current && styles.active)}>
              <FallbackImage
                fade={i !== 0}
                src={s.backdrop}
                alt=""
                fill
                sizes={HERO_SIZES}
                quality={75}
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                className={styles.backdropImg}
              />
            </div>
          ) : null,
        )}
        <div className={styles.scrim} />
      </div>

      <div className={cx("container", styles.layout)}>
        <div key={slide.id} className={styles.copy} aria-live={paused ? "polite" : "off"}>
          <p className={styles.kicker}>
            <span className={styles.kickerDot} aria-hidden />
            Tonight&apos;s feature
          </p>
          <h2 className={styles.title}>{slide.title}</h2>

          <dl className={styles.slate}>
            {slide.year ? (
              <div>
                <dt>Year</dt>
                <dd>{slide.year}</dd>
              </div>
            ) : null}
            {slide.runtime ? (
              <div>
                <dt>Runtime</dt>
                <dd>{slide.runtime}</dd>
              </div>
            ) : null}
            {slide.rating ? (
              <div>
                <dt>IMDb</dt>
                <dd className={styles.rating}>{slide.rating}</dd>
              </div>
            ) : null}
            {slide.mpa ? (
              <div>
                <dt>Rated</dt>
                <dd>{slide.mpa}</dd>
              </div>
            ) : null}
            {slide.genres.length ? (
              <div className={styles.slateWide}>
                <dt>Genre</dt>
                <dd>{slide.genres.join(", ")}</dd>
              </div>
            ) : null}
          </dl>

          {slide.summary && <p className={styles.synopsis}>{slide.summary}</p>}

          <div className={styles.ctas}>
            <ButtonLink href={watchHref(slide.id)} size="lg" prefetch={false}>
              <Play aria-hidden fill="currentColor" />
              Play
            </ButtonLink>
            <ButtonLink href={slide.href} variant="glass" size="lg">
              <Info aria-hidden />
              Details
            </ButtonLink>
            <WatchlistButton movieId={slide.id} variant="full" size="lg" tone="glass" title={slide.title} />
          </div>
        </div>

        {count > 1 && (
          <nav className={styles.programme} aria-label="Featured films">
            <p className={styles.programmeHead}>
              <span>Now showing</span>
              <span className="mono">
                {current + 1}/{count}
              </span>
            </p>
            <ol role="list" className={styles.programmeList}>
              {slides.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={cx(styles.programmeItem, i === current && styles.programmeActive)}
                    aria-current={i === current ? "true" : undefined}
                    onClick={() => go(i)}
                  >
                    <span className={styles.programmeIndex} aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.programmeTitle}>{s.title}</span>
                    {i === current && (
                      <span
                        key={`${s.id}-${current}`}
                        className={styles.progress}
                        aria-hidden
                        onAnimationEnd={() => go((current + 1) % count)}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </section>
  );
}
