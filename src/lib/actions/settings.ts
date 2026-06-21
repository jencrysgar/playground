"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function updateProfile(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const trimmed = name.trim();
  if (trimmed) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: trimmed },
    });
  }
  revalidatePath("/settings");
}

export async function setDefaultLanding(path: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.user.update({
    where: { id: user.id },
    data: { defaultLanding: path },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function setThemePreference(theme: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { theme },
  });
}
