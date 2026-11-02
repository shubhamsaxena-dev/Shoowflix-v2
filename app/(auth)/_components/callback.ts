/**
 * Normalises a callbackUrl to a same-site relative path.
 * NextAuth sometimes passes an absolute URL; we keep only path + query + hash so
 * we can never redirect off-site, and never bounce back into the auth pages.
 */
export function safeCallbackUrl(raw: string | string[] | undefined | null): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "/";
  let path = value;
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      const u = new URL(value);
      path = u.pathname + u.search + u.hash;
    }
  } catch {
    return "/";
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  if (/^\/(signin|register)(\/|\?|$)/.test(path) || path.startsWith("/api/auth")) return "/";
  return path;
}

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: "That email and password don’t match. If you signed up with Google, use the Google button instead.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method. Use the method you signed up with.",
  OAuthSignin: "Google sign-in couldn’t start. Try again in a moment.",
  OAuthCallback: "Google sign-in didn’t complete. Try again in a moment.",
  OAuthCreateAccount: "We couldn’t create your account with Google. Try again or use email instead.",
  Callback: "Sign-in didn’t complete. Try again in a moment.",
  AccessDenied: "Access was denied for this account.",
  SessionRequired: "Sign in to see that page.",
  Configuration: "Sign-in is temporarily unavailable. Try again later.",
};

export function authErrorMessage(code: string | string[] | undefined | null): string | null {
  const value = Array.isArray(code) ? code[0] : code;
  if (!value) return null;
  return AUTH_ERRORS[value] ?? "Sign-in didn’t complete. Try again.";
}
