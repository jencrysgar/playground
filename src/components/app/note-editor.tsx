"use client";

import { useState, useTransition } from "react";
import { StickyNote, Lock } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { saveNote } from "@/lib/actions/notes";

export function NoteEditor({
  path,
  title,
  initialContent,
}: {
  path: string;
  title: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      await saveNote(path, title, content);
      setStatus("Saved");
      setTimeout(() => setStatus(null), 1800);
    });
  }

  return (
    <div className="glass glow rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">My private note</h3>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
          <Lock className="h-3 w-3" /> Private to you
        </span>
      </div>
      <Textarea
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Jot down what you found useful about this page…"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
        {status && <span className="text-sm text-emerald-500">{status}</span>}
      </div>
    </div>
  );
}
