"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Trash2, ExternalLink, X } from "lucide-react";
import { Button, Input, Label, TagPill } from "@/components/ui";
import { addLink, deleteLink, type LinkState } from "@/lib/actions/links";

type LibLink = {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
};

export function LibraryManager({ links }: { links: LibLink[] }) {
  const [showForm, setShowForm] = useState(false);
  const [state, action, pending] = useActionState<LinkState, FormData>(
    async (prev, fd) => {
      const res = await addLink(prev, fd);
      if (res?.ok) setShowForm(false);
      return res;
    },
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add link"}
        </Button>
      </div>

      {showForm && (
        <form action={action} className="glass glow flex flex-col gap-3 rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" placeholder="https://…" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Name this link" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional note" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" placeholder="research, coding" />
          </div>
          {state?.error && <p className="text-sm text-rose-500">{state.error}</p>}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save link"}
            </Button>
          </div>
        </form>
      )}

      {links.length === 0 ? (
        <div className="glass-2 flex flex-col items-center gap-2 rounded-2xl px-6 py-16 text-center">
          <ExternalLink className="h-6 w-6 text-primary" />
          <p className="font-medium">Your library is empty</p>
          <p className="text-sm text-muted">Add your favorite AI links to keep them handy.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <div key={l.id} className="glass glow glow-hover group relative flex flex-col gap-2 rounded-2xl p-4">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(l.url)}&sz=64`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded"
                />
                <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
              </a>
              {l.description && <p className="text-sm text-muted">{l.description}</p>}
              <p className="truncate text-xs text-muted">{l.url}</p>
              {l.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {l.tags.map((t) => (
                    <TagPill key={t} name={t} color="blue" />
                  ))}
                </div>
              )}
              <DeleteLinkBtn id={l.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteLinkBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deleteLink(id))}
      disabled={pending}
      aria-label="Delete link"
      className="absolute right-2 top-2 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
