"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Increment the current user's usage count for a prompt (copy or open). */
export async function recordPromptUse(
  promptId: string,
): Promise<{ count: number }> {
  const user = await getCurrentUser();
  if (!user) return { count: 0 };
  const usage = await prisma.promptUsage.upsert({
    where: { userId_promptId: { userId: user.id, promptId } },
    update: { count: { increment: 1 } },
    create: { userId: user.id, promptId, count: 1 },
  });
  return { count: usage.count };
}
