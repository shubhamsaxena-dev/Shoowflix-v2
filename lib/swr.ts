/**
 * Shared SWR primitives. All client hooks in /hooks build on these.
 *
 * Conventions:
 * - Keys are plain API paths ("/api/movies?genre=drama&page=1"), never arrays,
 *   so `mutate(key)` from anywhere invalidates the same cache entry.
 * - Pages pass server-fetched data in as `fallbackData` so the first render
 *   is SSR/ISR content and SWR only revalidates in the background.
 * - Mutations use `useSWRMutation` with optimistic updates.
 */

export class FetchError extends Error {
  status: number;
  info: unknown;
  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    let info: unknown = null;
    try {
      info = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new FetchError(`Request to ${url} failed`, res.status, info);
  }
  return res.json() as Promise<T>;
}

/** For useSWRMutation: `trigger(arg)` sends `arg` as JSON with the given method. */
export function sendJSON<TArg, TRes = unknown>(method: "POST" | "PUT" | "PATCH" | "DELETE") {
  return async (url: string, { arg }: { arg: TArg }): Promise<TRes> => {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(arg),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new FetchError((body as { message?: string })?.message ?? "Request failed", res.status, body);
    return body as TRes;
  };
}

export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === 0) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
