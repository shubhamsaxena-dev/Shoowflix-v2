/**
 * Signed links for casting. Chrome renders a Presentation API URL in its own off-the-record
 * session (no cookies), so the TV can't pass the disclaimer/sign-in gates. Instead the
 * watch page — reachable only by signed-in members who accepted the terms — mints a
 * short-lived link bound to one film. Web Crypto only (works in route handlers and pages).
 */

const CAST_TTL_SECONDS = 60 * 60 * 12;
const encoder = new TextEncoder();

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign cast links");
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
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(`cast:${payload}`)));
}

/** Token: `<expiresAtSeconds>.<hmac(movieId.expiresAt)>` */
export async function createCastToken(movieId: number, now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + CAST_TTL_SECONDS;
  return `${exp}.${await sign(`${movieId}.${exp}`)}`;
}

export async function verifyCastToken(movieId: number, token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [expRaw, sig, ...rest] = token.split(".");
  if (!expRaw || !sig || rest.length) return false;
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || exp < now / 1000) return false;
  const expected = await sign(`${movieId}.${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export function castPath(movieId: number, token: string, quality?: string): string {
  const qs = new URLSearchParams({ t: token });
  if (quality) qs.set("q", quality);
  return `/cast/${movieId}?${qs}`;
}
