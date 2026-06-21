"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Save (or clear) the current user's personalized copy of a prompt/skill prompt. */
export async function saveUserPromptCopy(
  targetType: "prompt" | "skill",
  targetId: string,
  content: string,
  revalidate?: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const trimmed = content.trim();
  if (!trimmed) {
    await prisma.userPromptCopy.deleteMany({
      where: { userId: user.id, targetType, targetId },
    });
  } else {
    await prisma.userPromptCopy.upsert({
      where: {
        userId_targetType_targetId: { userId: user.id, targetType, targetId },
      },
      update: { content: trimmed },
      create: { userId: user.id, targetType, targetId, content: trimmed },
    });
  }
  if (revalidate) revalidatePath(revalidate);
  return { ok: true };
}
