"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import type { WatchProgressDTO } from "@/lib/server/types";

export type { WatchProgressDTO };

const API_KEY = "/api/progress";
const LOCAL_KEY = "shoowflix:progress";
const LOCAL_EVENT = "shoowflix:progress-change";
const MAX_LOCAL = 24;
/** Minimum gap between network writes for the same title. */
const THROTTLE_MS = 15_000;

/* ---------------- localStorage store (signed-out fallback) ---------------- */

const EMPTY: WatchProgressDTO[] = [];
let cachedRaw: string | null = null;
let cachedItems: WatchProgressDTO[] = EMPTY;

function readLocal(): WatchProgressDTO[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LOCAL_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cachedItems = Array.isArray(parsed) ? (parsed as WatchProgressDTO[]) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function writeLocal(items: WatchProgressDTO[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL)));
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

function subscribeLocal(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === LOCAL_KEY && cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_EVENT, cb);
  };
}

function upsertList(list: WatchProgressDTO[], dto: WatchProgressDTO): WatchProgressDTO[] {
  return [dto, ...list.filter((i) => i.movieId !== dto.movieId)];
}

/* ---------------- network ---------------- */

function putProgress(dto: WatchProgressDTO, keepalive = false) {
  return fetch(API_KEY, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
    keepalive,
  });
}

/** Fraction watched, clamped 0..1 (0 when duration unknown). */
export function progressRatio(item: Pick<WatchProgressDTO, "position" | "duration">): number {
  if (!item.duration) return 0;
  return Math.min(1, Math.max(0, item.position / item.duration));
}

/**
 * Continue-watching state.
 * Signed in → SWR on /api/progress with optimistic, throttled PUTs.
 * Signed out → localStorage (shared across tabs via the storage event).
 */
export function useContinueWatching() {
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const { data, mutate, isLoading } = useSWR<{ items: WatchProgressDTO[] }>(signedIn ? API_KEY : null);
  const localItems = useSyncExternalStore(subscribeLocal, readLocal, () => EMPTY);

  const signedInRef = useRef(signedIn);
  useEffect(() => {
    signedInRef.current = signedIn;
  }, [signedIn]);

  // Per-title throttle bookkeeping: last network write + pending trailing write.
  const lastSent = useRef(new Map<number, number>());
  const pending = useRef(new Map<number, { dto: WatchProgressDTO; timer: ReturnType<typeof setTimeout> }>());

  const send = useCallback(
    (dto: WatchProgressDTO, keepalive = false) => {
      lastSent.current.set(dto.movieId, Date.now());
      putProgress(dto, keepalive).catch(() => {
        /* transient — next heartbeat retries */
      });
    },
    [],
  );

  /** Flush any queued trailing write right now (e.g. on pagehide / unmount). */
  const flush = useCallback(() => {
    for (const [id, p] of pending.current) {
      clearTimeout(p.timer);
      if (signedInRef.current) send(p.dto, true);
      pending.current.delete(id);
    }
  }, [send]);

  const save = useCallback(
    (input: WatchProgressDTO, opts: { immediate?: boolean } = {}) => {
      const dto: WatchProgressDTO = { ...input, updatedAt: new Date().toISOString() };

      if (!signedInRef.current) {
        writeLocal(upsertList(readLocal(), dto));
        return;
      }

      // Optimistic cache update, no revalidation.
      void mutate((cur) => ({ items: upsertList(cur?.items ?? [], dto) }), { revalidate: false });

      const prev = pending.current.get(dto.movieId);
      if (prev) clearTimeout(prev.timer);
      const since = Date.now() - (lastSent.current.get(dto.movieId) ?? 0);

      if (opts.immediate || since >= THROTTLE_MS) {
        pending.current.delete(dto.movieId);
        send(dto, opts.immediate);
        return;
      }
      const timer = setTimeout(() => {
        pending.current.delete(dto.movieId);
        send(dto);
      }, THROTTLE_MS - since);
      pending.current.set(dto.movieId, { dto, timer });
    },
    [mutate, send],
  );

  const remove = useCallback(
    async (movieId: number) => {
      const p = pending.current.get(movieId);
      if (p) {
        clearTimeout(p.timer);
        pending.current.delete(movieId);
      }
      if (!signedInRef.current) {
        writeLocal(readLocal().filter((i) => i.movieId !== movieId));
        return;
      }
      await mutate(
        async (cur) => {
          await fetch(`${API_KEY}?movieId=${movieId}`, { method: "DELETE" });
          return { items: (cur?.items ?? []).filter((i) => i.movieId !== movieId) };
        },
        {
          optimisticData: (cur) => ({ items: (cur?.items ?? []).filter((i) => i.movieId !== movieId) }),
          rollbackOnError: true,
          revalidate: false,
        },
      );
    },
    [mutate],
  );

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, [flush]);

  const items = signedIn ? (data?.items ?? EMPTY) : localItems;
  const get = useCallback((movieId: number) => items.find((i) => i.movieId === movieId), [items]);

  return useMemo(
    () => ({
      items,
      isLoading: status === "loading" || (signedIn && isLoading),
      save,
      remove,
      flush,
      get,
    }),
    [items, status, signedIn, isLoading, save, remove, flush, get],
  );
}
