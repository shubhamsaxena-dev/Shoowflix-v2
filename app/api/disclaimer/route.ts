import { NextResponse, type NextRequest } from "next/server";
import {
  DISCLAIMER_COOKIE,
  DISCLAIMER_MAX_AGE,
  createAcceptance,
  safeReturnTo,
} from "@/lib/disclaimer";

/**
 * Accept the disclaimer. A plain HTML form posts here (works without JavaScript);
 * we set a signed HttpOnly cookie and send the visitor back to where they were going.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const agreed = form?.get("agree") === "yes";
  const returnTo = safeReturnTo(form?.get("returnTo")?.toString());

  if (!agreed) {
    const url = new URL("/disclaimer", request.url);
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url, 303);
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(DISCLAIMER_COOKIE, await createAcceptance(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DISCLAIMER_MAX_AGE,
  });
  return response;
}
