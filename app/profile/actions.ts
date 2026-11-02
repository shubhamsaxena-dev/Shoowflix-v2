"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NameFormState = { status: "idle" | "saved" | "error"; message?: string; name?: string };

export async function updateName(_prev: NameFormState, formData: FormData): Promise<NameFormState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Your session expired. Sign in again to make changes." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Enter a display name." };
  if (name.length > 60) return { status: "error", message: "Keep your name under 60 characters." };

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  } catch {
    return { status: "error", message: "Your name couldn’t be saved. Try again in a moment." };
  }
  revalidatePath("/profile");
  return { status: "saved", message: "Name saved.", name };
}
