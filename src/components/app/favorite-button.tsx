"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { cn } from "@/components/ui";

export function FavoriteButton({
  path,
  title,
  initialFavorited,
  withLabel = false,
}: {
  path: string;
  title: string;
  initialFavorited: boolean;
  withLabel?: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setFavorited((v) => !v);
    startTransition(async () => {
      const res = await toggleFavorite(path, title);
      setFavorited(res.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 ring-focus transition",
        withLabel ? "h-9 text-sm font-medium" : "h-9 w-9 justify-center",
        favorited
          ? "bg-amber-400/15 text-amber-500"
          : "glass text-muted hover:text-foreground",
      )}
    >
      <Star className={cn("h-4 w-4", favorited && "fill-amber-400")} />
      {withLabel && (favorited ? "Favorited" : "Favorite")}
    </button>
  );
}
