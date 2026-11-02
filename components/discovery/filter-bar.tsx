"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { GENRES } from "@/types/movie";
import { cx } from "@/lib/movie-utils";
import { DEFAULT_SORT, MIN_RATINGS, QUALITIES, SORTS, genreLabel, isGenre, isSortKey } from "./catalog";
import styles from "./discovery.module.css";

type Key = "genre" | "quality" | "rating" | "sort" | "order";

const GENRE_OPTIONS = [{ value: "", label: "All genres" }, ...GENRES.map((g) => ({ value: g, label: genreLabel(g) }))];
const QUALITY_OPTIONS = [{ value: "", label: "Any quality" }, ...QUALITIES.map((q) => ({ value: q, label: q }))];
const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  ...MIN_RATINGS.map((r) => ({ value: String(r), label: `${r}+ on IMDb` })),
];
const SORT_OPTIONS = SORTS.map((s) => ({ value: s.value, label: s.label }));

/**
 * Browse filters, mirrored in the URL. Lives in app/browse/layout.tsx so it survives
 * the server re-render each change triggers (router.replace, no scroll).
 * Desktop: inline selects. Mobile: active-filter chips + a bottom sheet.
 */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const state = {
    genre: isGenre(params.get("genre")) ? params.get("genre")! : "",
    quality: (QUALITIES as readonly string[]).includes(params.get("quality") ?? "") ? params.get("quality")! : "",
    rating: (MIN_RATINGS as readonly number[]).includes(Number(params.get("rating"))) ? params.get("rating")! : "",
    sort: isSortKey(params.get("sort")) ? params.get("sort")! : DEFAULT_SORT,
    order: params.get("order") === "asc" ? "asc" : "desc",
  } satisfies Record<Key, string>;

  const update = (patch: Partial<Record<Key, string>>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      const isDefault = !v || (k === "sort" && v === DEFAULT_SORT) || (k === "order" && v === "desc");
      if (isDefault) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const active = [
    state.genre && { key: "genre" as const, label: genreLabel(state.genre) },
    state.quality && { key: "quality" as const, label: state.quality },
    state.rating && { key: "rating" as const, label: `${state.rating}+ IMDb` },
  ].filter(Boolean) as Array<{ key: Key; label: string }>;

  const OrderIcon = state.order === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  const orderButton = (
    <Button
      variant="outline"
      size="sm"
      icon
      onClick={() => update({ order: state.order === "asc" ? "desc" : "asc" })}
      aria-label={state.order === "asc" ? "Ascending order. Switch to descending" : "Descending order. Switch to ascending"}
    >
      <OrderIcon aria-hidden />
    </Button>
  );

  return (
    <div className={cx(styles.filterBar, pending && styles.pending)} aria-busy={pending || undefined}>
      {/* Desktop */}
      <div className={styles.filterInline} role="group" aria-label="Filter films">
        <Select size="sm" aria-label="Genre" value={state.genre} options={GENRE_OPTIONS} onChange={(e) => update({ genre: e.target.value })} />
        <Select size="sm" aria-label="Quality" value={state.quality} options={QUALITY_OPTIONS} onChange={(e) => update({ quality: e.target.value })} />
        <Select size="sm" aria-label="Minimum rating" value={state.rating} options={RATING_OPTIONS} onChange={(e) => update({ rating: e.target.value })} />
        <span className={styles.filterDivider} aria-hidden />
        <Select size="sm" aria-label="Sort by" value={state.sort} options={SORT_OPTIONS} onChange={(e) => update({ sort: e.target.value })} />
        {orderButton}
        {active.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => update({ genre: "", quality: "", rating: "" })}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Mobile */}
      <div className={styles.filterMobile}>
        <Button variant="secondary" size="sm" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal aria-hidden />
          Filters{active.length ? <span className="mono"> ({active.length})</span> : null}
        </Button>
        <div className={styles.activeChips}>
          {active.map((a) => (
            <Chip key={a.key} size="sm" onClick={() => update({ [a.key]: "" })} aria-label={`Remove filter ${a.label}`}>
              {a.label}
              <X aria-hidden width={12} height={12} />
            </Chip>
          ))}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        side="bottom"
        title="Filter films"
        footer={
          <div className={styles.sheetFooter}>
            <Button variant="ghost" onClick={() => update({ genre: "", quality: "", rating: "", sort: "", order: "" })}>
              Reset
            </Button>
            <Button onClick={() => setSheetOpen(false)} loading={pending}>
              Show films
            </Button>
          </div>
        }
      >
        <div className={styles.sheetFields}>
          <Field label="Genre">
            <Select value={state.genre} options={GENRE_OPTIONS} onChange={(e) => update({ genre: e.target.value })} />
          </Field>
          <Field label="Quality">
            <Select value={state.quality} options={QUALITY_OPTIONS} onChange={(e) => update({ quality: e.target.value })} />
          </Field>
          <Field label="Minimum rating">
            <Select value={state.rating} options={RATING_OPTIONS} onChange={(e) => update({ rating: e.target.value })} />
          </Field>
          <Field label="Sort by" labelAside={orderButton}>
            <Select value={state.sort} options={SORT_OPTIONS} onChange={(e) => update({ sort: e.target.value })} />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
