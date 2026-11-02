import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { DISCLAIMER_COOKIE, isAcceptanceValid } from "@/lib/disclaimer";

/**
 * Next 16 proxy (formerly middleware). Runs only on the routes in `config.matcher`.
 *
 * Browsing is public and indexable: film pages, lists and the public APIs carry no torrent
 * data (see withoutTorrents in lib/yts.ts). Streaming is what the terms are about, so:
 *
 * 1. /watch/* needs the disclaimer: a signed, HttpOnly, versioned cookie set by
 *    POST /api/disclaimer. It can't be skipped by removing UI, disabling JS or writing
 *    a cookie by hand. Magnets and hashes only exist on this route.
 * 2. /watch/*, /profile and /my-list need a signed-in user (the pages check auth() too).
 */

const NEEDS_TERMS = /^\/watch(\/|$)/;
const NEEDS_SIGN_IN = /^\/(watch|profile|my-list)(\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const back = pathname + search;

  if (NEEDS_TERMS.test(pathname)) {
    const accepted = await isAcceptanceValid(request.cookies.get(DISCLAIMER_COOKIE)?.value);
    if (!accepted) {
      const url = request.nextUrl.clone();
      url.pathname = "/disclaimer";
      url.search = `?returnTo=${encodeURIComponent(back)}`;
      return NextResponse.redirect(url);
    }
  }

  if (NEEDS_SIGN_IN.test(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.search = `?callbackUrl=${encodeURIComponent(back)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/watch/:path*", "/profile/:path*", "/my-list/:path*"],
};
