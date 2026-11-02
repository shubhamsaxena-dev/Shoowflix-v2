"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { sendJSON } from "@/lib/swr";
import { useToast } from "@/components/ui/toast";

export const WATCHLIST_KEY = "/api/watchlist";

type WatchlistResponse = { ids: string[] };
type WatchlistArg = { movieId: number; action: "add" | "remove" };

const EMPTY: string[] = [];

/**
 * The signed-in user's "My List".
 * Reads GET /api/watchlist, writes POST /api/watchlist optimistically (rolls back on error).
 * Signed-out users get a toast prompting them to sign in instead.
 */
export function useWatchlist() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const authed = status === "authenticated";

  const { data, isLoading } = useSWR<WatchlistResponse>(authed ? WATCHLIST_KEY : null);
  const { trigger } = useSWRMutation(WATCHLIST_KEY, sendJSON<WatchlistArg, WatchlistResponse>("POST"));

  const ids = data?.ids ?? EMPTY;
  const idSet = useMemo(() => new Set(ids), [ids]);
  const has = useCallback((id: number) => idSet.has(String(id)), [idSet]);

  const toggle = useCallback(
    async (id: number) => {
      if (status === "loading") return;
      if (!authed) {
        toast({
          title: "Sign in to save films",
          description: "My List keeps the films you want to watch later.",
          action: {
            label: "Sign in",
            onClick: () => {
              const here = window.location.pathname + window.location.search;
              router.push(`/signin?callbackUrl=${encodeURIComponent(here)}`);
            },
          },
        });
        return;
      }

      const key = String(id);
      const adding = !idSet.has(key);
      try {
        await trigger(
          { movieId: id, action: adding ? "add" : "remove" },
          {
            optimisticData: (current?: WatchlistResponse) => {
              const list = current?.ids ?? [];
              return { ids: adding ? [key, ...list.filter((x) => x !== key)] : list.filter((x) => x !== key) };
            },
            rollbackOnError: true,
            populateCache: (result: WatchlistResponse) => result,
            revalidate: false,
          },
        );
        toast({
          title: adding ? "Added to My List" : "Removed from My List",
          tone: adding ? "success" : "default",
          action: adding ? { label: "View list", onClick: () => router.push("/my-list") } : undefined,
          duration: 3500,
        });
      } catch {
        toast({
          title: adding ? "Couldn't add to My List" : "Couldn't remove from My List",
          description: "Check your connection and try again.",
          tone: "danger",
        });
      }
    },
    [authed, status, idSet, trigger, toast, router],
  );

  return {
    ids,
    has,
    toggle,
    isLoading: authed ? isLoading : status === "loading",
    /** True once the server list has loaded (ids reflect the real list, not the empty default). */
    ready: data !== undefined,
  };
}
