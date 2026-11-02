/**
 * Disclaimer acceptance, enforced on the server (proxy.ts) with a signed, HttpOnly cookie.
 * Web Crypto only, so it runs in the proxy and in route handlers alike.
 * Not a "use client" module: the proxy, route handler and pages all import it.
 */

/** Bump when the disclaimer text changes materially — everyone is asked again. */
export const DISCLAIMER_VERSION = "2026-11";
export const DISCLAIMER_COOKIE = "shoowflix_terms";
/** Acceptance lasts 30 days, then visitors confirm again. */
export const DISCLAIMER_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign the disclaimer cookie");
  return s;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** Cookie value: `<version>.<issuedAtSeconds>.<hmac>` */
export async function createAcceptance(now = Date.now()): Promise<string> {
  const payload = `${DISCLAIMER_VERSION}.${Math.floor(now / 1000)}`;
  return `${payload}.${await sign(payload)}`;
}

/** Valid = current version, not expired, and signed by us (so it can't be typed in by hand). */
export async function isAcceptanceValid(value: string | undefined, now = Date.now()): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, issued, sig] = parts as [string, string, string];
  if (version !== DISCLAIMER_VERSION) return false;
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt) || now / 1000 - issuedAt > DISCLAIMER_MAX_AGE || issuedAt > now / 1000 + 60) return false;
  const expected = await sign(`${version}.${issued}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

/** Only same-site paths are allowed as the post-accept destination (no open redirects). */
export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw.startsWith("/disclaimer")) return "/";
  return raw;
}
