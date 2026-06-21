"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2, ArrowUpRight } from "lucide-react";
import { deleteNote } from "@/lib/actions/notes";

type Note = {
  id: string;
  path: string;
  title: string;
  content: string;
  updatedAt: string;
};

export function NotesList({ notes }: { notes: Note[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {notes.map((n) => (
        <div key={n.id} className="glass glow group relative flex flex-col gap-2 rounded-2xl p-4">
          <Link href={n.path} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {n.title || n.path}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <p className="whitespace-pre-wrap text-sm text-foreground/85">{n.content}</p>
          <span className="text-xs text-muted">
            Updated {new Date(n.updatedAt).toLocaleDateString()}
          </span>
          <DeleteNoteBtn id={n.id} />
        </div>
      ))}
    </div>
  );
}

function DeleteNoteBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deleteNote(id))}
      disabled={pending}
      aria-label="Delete note"
      className="absolute right-2 top-2 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
