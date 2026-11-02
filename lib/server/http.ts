import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

/** Cache-Control presets for Route Handlers. */
export const CACHE = {
  /** Public catalog data — CDN caches 10 min, serves stale for a day while revalidating. */
  public: "public, s-maxage=600, stale-while-revalidate=86400",
  /** Per-user data — never cached by browsers or CDNs. */
  private: "private, no-store",
} as const;

export function json<T>(body: T, init: { status?: number; cache?: string; headers?: HeadersInit } = {}) {
  const headers = new Headers(init.headers);
  if (init.cache) headers.set("Cache-Control", init.cache);
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}

/** Uniform error body: `{ message, issues? }`. */
export function jsonError(status: number, message: string, extra?: Record<string, unknown>, cache: string = CACHE.private) {
  return json({ message, ...extra }, { status, cache });
}

export const unauthorized = () => jsonError(401, "Sign in to continue.");
export const notFound = (what = "Resource") => jsonError(404, `${what} not found.`);
export const badRequest = (message: string, issues?: unknown) =>
  jsonError(400, message, issues ? { issues } : undefined);
export const serverError = (message = "Something went wrong on our side. Try again in a moment.") =>
  jsonError(500, message);

/** Flatten zod issues into `{ path, message }[]` for clients. */
export function formatIssues(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parse + validate a JSON request body. Returns a ready-made 400 response on failure. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<ParseResult<z.output<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: badRequest("Request body must be valid JSON.") };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = formatIssues(result.error);
    return { ok: false, response: badRequest(issues[0]?.message ?? "Invalid request.", issues) };
  }
  return { ok: true, data: result.data };
}

/** Validate URLSearchParams against a schema (empty strings are dropped first). */
export function parseSearchParams<S extends z.ZodType>(params: URLSearchParams, schema: S): ParseResult<z.output<S>> {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value !== "") raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = formatIssues(result.error);
    return { ok: false, response: badRequest(issues[0]?.message ?? "Invalid query.", issues) };
  }
  return { ok: true, data: result.data };
}

/** Best-effort client IP (behind Vercel / proxies). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
