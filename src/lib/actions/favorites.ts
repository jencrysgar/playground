"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function toggleFavorite(path: string, title: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const existing = await prisma.favorite.findUnique({
    where: { userId_path: { userId: user.id, path } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: { userId: user.id, path, title },
    });
  }
  revalidatePath(path);
  revalidatePath("/favorites");
  return { favorited: !existing };
}

export async function removeFavorite(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.favorite.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/favorites");
}

export async function setFavoritesPrefs(view: "CARD" | "LIST", expanded: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.user.update({
    where: { id: user.id },
    data: { favoritesView: view, favoritesExpanded: expanded },
  });
  revalidatePath("/favorites");
}
