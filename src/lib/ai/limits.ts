import "server-only";
import { prisma } from "@/lib/db";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

const HOUR_MS = 60 * 60 * 1000;

function limitFor(kind: "search" | "import"): number {
  if (kind === "search") return Number(process.env.AI_SEARCH_LIMIT_PER_HOUR || 30);
  return Number(process.env.AI_IMPORT_LIMIT_PER_HOUR || 20);
}

/**
 * Per-user hourly guardrail on AI calls to keep cost bounded. Counts recent
 * calls of the given kind; throws RateLimitError if over the limit, otherwise
 * records this call.
 */
export async function enforceAiLimit(userId: string, kind: "search" | "import") {
  const limit = limitFor(kind);
  const since = new Date(Date.now() - HOUR_MS);
  const recent = await prisma.aiCall.count({
    where: { userId, kind, createdAt: { gte: since } },
  });
  if (recent >= limit) {
    throw new RateLimitError(
      `You've reached the hourly AI ${kind} limit (${limit}/hour). Please try again later.`,
    );
  }
  await prisma.aiCall.create({ data: { userId, kind } });
}
