import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { DISCLAIMER_COOKIE, isAcceptanceValid } from "@/lib/disclaimer";

/**
 * Next 16 proxy (formerly middleware). Runs on the server before every matched request.
 *
 * 1. Disclaimer gate — nothing on the site is served until the visitor has accepted the terms.
 *    Acceptance is a signed HttpOnly cookie set by POST /api/disclaimer, so it can't be skipped
 *    by removing a modal, disabling JavaScript, calling the API directly, or hand-writing a cookie.
 * 2. Signed-in only — account pages and watching films. Signed-out visitors go to /signin with a
 *    callbackUrl back to where they were.
 */

/** Reachable without accepting: the gate itself, auth callbacks, and files crawlers/OS fetch. */
const OPEN_PATHS = [
  /^\/disclaimer$/,
  /^\/api\/disclaimer$/,
  /^\/api\/auth\//,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/manifest\.webmanifest$/,
  /^\/opengraph-image/,
  /^\/sw\.js$/,
];

/** Pages that need a signed-in user: the account area and the player. */
const SIGNED_IN_PATHS = /^\/(profile|my-list|watch)(\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!OPEN_PATHS.some((re) => re.test(pathname))) {
    const accepted = await isAcceptanceValid(request.cookies.get(DISCLAIMER_COOKIE)?.value);
    if (!accepted) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Accept the Shoowflix terms at /disclaimer first." }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/disclaimer";
      url.search = `?returnTo=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  if (SIGNED_IN_PATHS.test(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files in /public (images, icons, fonts).
  matcher: ["/((?!_next/|brand/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$).*)"],
};
