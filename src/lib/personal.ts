import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Note content + favorite state for the current user on a given page path. */
export async function getPagePersonal(path: string) {
  const user = await getCurrentUser();
  if (!user) return { favorited: false, note: "" };
  const [favorite, note] = await Promise.all([
    prisma.favorite.findUnique({
      where: { userId_path: { userId: user.id, path } },
    }),
    prisma.note.findUnique({
      where: { userId_path: { userId: user.id, path } },
    }),
  ]);
  return { favorited: Boolean(favorite), note: note?.content ?? "" };
}
