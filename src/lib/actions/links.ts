"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const linkSchema = z.object({
  url: z.string().url("Enter a valid URL (include https://)."),
  title: z.string().min(1, "Enter a title.").max(160),
  description: z.string().max(500).optional(),
  tags: z.string().optional(),
});

export type LinkState = { error?: string; ok?: boolean } | undefined;

export async function addLink(
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  const parsed = linkSchema.safeParse({
    url: formData.get("url"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    tags: formData.get("tags") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const tagNames = (parsed.data.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
  await prisma.link.create({
    data: {
      userId: user.id,
      url: parsed.data.url,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() ?? "",
      tags: { create: tagNames.map((name) => ({ name })) },
    },
  });
  revalidatePath("/library");
  return { ok: true };
}

export async function deleteLink(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await prisma.link.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/library");
}
