import "server-only";
import { auth } from "@/lib/auth";

/** The signed-in user's id, or null. */
export async function currentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
