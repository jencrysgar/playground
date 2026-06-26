import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureSection } from "@/lib/access";
import { PageHeader } from "@/components/ui";
import { FavoritesView } from "@/components/app/favorites-view";

export default async function FavoritesPage() {
  const user = (await getCurrentUser())!;
  await ensureSection(user, "favorites");
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Favorites"
        description="Everything you've starred, your way."
        icon={<Star className="h-5 w-5" />}
      />
      <FavoritesView
        favorites={favorites.map((f) => ({
          id: f.id,
          path: f.path,
          title: f.title,
          createdAt: f.createdAt.toISOString(),
        }))}
        initialView={user.favoritesView === "LIST" ? "LIST" : "CARD"}
        initialExpanded={user.favoritesExpanded}
      />
    </div>
  );
}
