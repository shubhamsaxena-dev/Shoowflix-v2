import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next 16 proxy (formerly middleware). First line of defence for account pages:
 * signed-out visitors are sent to /signin with a callbackUrl back to where they were.
 * Pages also check auth() on the server, so this is a fast path, not the only guard.
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/profile/:path*", "/my-list/:path*"],
};
