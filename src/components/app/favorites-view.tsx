"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  Trash2,
  Star,
} from "lucide-react";
import { cn } from "@/components/ui";
import { setFavoritesPrefs, removeFavorite } from "@/lib/actions/favorites";

type Fav = { id: string; path: string; title: string; createdAt: string };

export function FavoritesView({
  favorites,
  initialView,
  initialExpanded,
}: {
  favorites: Fav[];
  initialView: "CARD" | "LIST";
  initialExpanded: boolean;
}) {
  const [view, setView] = useState<"CARD" | "LIST">(initialView);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [, startTransition] = useTransition();

  function persist(nextView: "CARD" | "LIST", nextExpanded: boolean) {
    startTransition(() => setFavoritesPrefs(nextView, nextExpanded));
  }

  function changeView(v: "CARD" | "LIST") {
    setView(v);
    persist(v, expanded);
  }
  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    persist(view, next);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl glass p-1">
          <ViewBtn active={view === "CARD"} onClick={() => changeView("CARD")} icon={<LayoutGrid className="h-4 w-4" />} label="Cards" />
          <ViewBtn active={view === "LIST"} onClick={() => changeView("LIST")} icon={<List className="h-4 w-4" />} label="List" />
        </div>
        <button
          onClick={toggleExpanded}
          className="inline-flex h-9 items-center gap-2 rounded-xl glass px-3 text-sm font-medium ring-focus hover:border-[var(--ring)]"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {expanded ? "Expanded" : "Collapsed"}
        </button>
        <span className="ml-auto text-sm text-muted">
          {favorites.length} saved
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="glass-2 flex flex-col items-center gap-2 rounded-2xl px-6 py-16 text-center">
          <Star className="h-6 w-6 text-amber-500" />
          <p className="font-medium">No favorites yet</p>
          <p className="text-sm text-muted">
            Tap the star in the top bar (or on any page) to save it here.
          </p>
        </div>
      ) : view === "CARD" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <div key={f.id} className="glass glow glow-hover group relative rounded-2xl p-4">
              <Link href={f.path} className="flex flex-col gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{f.title}</span>
                {expanded && (
                  <span className="text-xs text-muted">{f.path}</span>
                )}
              </Link>
              <RemoveBtn id={f.id} />
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {favorites.map((f) => (
            <li key={f.id} className="glass glow group relative flex items-center gap-3 rounded-xl px-4 py-3">
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              <Link href={f.path} className="min-w-0 flex-1">
                <span className="block truncate font-medium">{f.title}</span>
                {expanded && (
                  <span className="block truncate text-xs text-muted">{f.path}</span>
                )}
              </Link>
              <RemoveBtn id={f.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function RemoveBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => removeFavorite(id))}
      disabled={pending}
      aria-label="Remove favorite"
      className="absolute right-2 top-2 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
