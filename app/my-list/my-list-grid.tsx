"use client";

import type { ReactNode } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { EmptyList } from "@/components/account/empty-list";
import styles from "./my-list.module.css";

/**
 * Server-rendered cards in, live list out: once the client watchlist has loaded,
 * films removed from My List (e.g. via a card's toggle) drop out without a reload.
 */
export function MyListGrid({ items }: { items: { id: number; node: ReactNode }[] }) {
  const { has, ready } = useWatchlist();
  const visible = ready ? items.filter((item) => has(item.id)) : items;

  if (!visible.length) return <EmptyList />;

  return (
    <>
      <p className={styles.count} aria-live="polite">
        <span className="mono">{visible.length}</span> {visible.length === 1 ? "film" : "films"}
      </p>
      <ul role="list" className={styles.grid}>
        {visible.map((item) => (
          <li key={item.id}>{item.node}</li>
        ))}
      </ul>
    </>
  );
}
