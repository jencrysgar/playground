"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { LinkButton, Button } from "@/components/ui";
import {
  deleteCourse,
  deleteSkill,
  deletePrompt,
  deleteAgent,
} from "@/lib/actions/content-admin";

type ContentType = "course" | "skill" | "prompt" | "agent";

const deleters: Record<ContentType, (id: string) => Promise<void>> = {
  course: deleteCourse,
  skill: deleteSkill,
  prompt: deletePrompt,
  agent: deleteAgent,
};

export function EditBar({
  editHref,
  type,
  id,
}: {
  editHref: string;
  type: ContentType;
  id: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <LinkButton href={editHref} variant="secondary" size="sm">
        <Pencil className="h-4 w-4" /> Edit
      </LinkButton>
      {confirming ? (
        <>
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => deleters[type](id))}
          >
            {pending ? "Deleting…" : "Confirm delete"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
