"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function saveNote(path: string, title: string, content: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const trimmed = content.trim();
  if (!trimmed) {
    await prisma.note.deleteMany({ where: { userId: user.id, path } });
  } else {
    await prisma.note.upsert({
      where: { userId_path: { userId: user.id, path } },
      update: { content: trimmed, title },
      create: { userId: user.id, path, title, content: trimmed },
    });
  }
  revalidatePath(path);
  revalidatePath("/notes");
  return { saved: true };
}

export async function deleteNote(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.note.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/notes");
}
