"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input, TagPill, cn } from "@/components/ui";
import { createTag, deleteTag, assignTag, unassignTag } from "@/lib/actions/admin";

const COLORS = ["purple", "pink", "blue", "emerald", "rose", "amber", "cyan"];

const SWATCH: Record<string, string> = {
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  cyan: "bg-cyan-500",
};

export function TagManager({
  tags,
}: {
  tags: { id: string; name: string; color: string }[];
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await createTag(name, color);
      if (res?.error) setError(res.error);
      else setName("");
    });
  }

  return (
    <div className="glass glow rounded-2xl p-5">
      <h3 className="mb-3 font-semibold">Create a tag</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name" />
        </div>
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={cn(
                "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-[var(--surface)] transition",
                SWATCH[c],
                color === c ? "ring-[var(--ring)]" : "ring-transparent",
              )}
            />
          ))}
        </div>
        <Button onClick={add} disabled={pending}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.id} className="group relative inline-flex">
            <TagPill name={t.name} color={t.color} />
            <button
              onClick={() => startTransition(() => deleteTag(t.id))}
              className="ml-1 text-muted hover:text-rose-500"
              aria-label={`Delete ${t.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TagAssigner({
  entityType,
  entityId,
  allTags,
  assigned,
}: {
  entityType: string;
  entityId: string;
  allTags: { id: string; name: string; color: string }[];
  assigned: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(assigned));
  const [, startTransition] = useTransition();

  function toggle(tagId: string) {
    const next = new Set(selected);
    const isOn = next.has(tagId);
    if (isOn) next.delete(tagId);
    else next.add(tagId);
    setSelected(next);
    startTransition(async () => {
      if (isOn) await unassignTag(tagId, entityType, entityId);
      else await assignTag(tagId, entityType, entityId);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {allTags.map((t) => {
        const on = selected.has(t.id);
        return (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className={cn(
              "rounded-full transition",
              on ? "ring-2 ring-[var(--ring)]" : "opacity-50 hover:opacity-100",
            )}
          >
            <TagPill name={t.name} color={t.color} />
          </button>
        );
      })}
      {allTags.length === 0 && (
        <span className="text-xs text-muted">Create a tag first.</span>
      )}
    </div>
  );
}
