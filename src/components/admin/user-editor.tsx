"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button, Input, cn } from "@/components/ui";
import { updateUser } from "@/lib/actions/admin";

const ROLES = ["USER", "EDITOR", "ADMIN"] as const;

export function UserEditor({
  userId,
  name,
  role,
  isSelf,
}: {
  userId: string;
  name: string;
  role: string;
  isSelf?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [current, setCurrent] = useState(role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setRole(r: string) {
    const prev = current;
    setCurrent(r);
    setError(null);
    startTransition(async () => {
      const res = await updateUser(userId, { role: r });
      if (res?.error) {
        setCurrent(prev);
        setError(res.error);
      }
    });
  }

  function saveName() {
    setError(null);
    startTransition(async () => {
      const res = await updateUser(userId, { name: nameValue });
      if (res?.error) setError(res.error);
      else setEditing(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl glass-2 p-1">
          {ROLES.map((r) => (
            <button
              key={r}
              disabled={isSelf || pending}
              onClick={() => setRole(r)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50",
                current === r ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit name">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      {editing && (
        <div className="flex items-center gap-2">
          <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="h-8 w-48" />
          <Button size="sm" onClick={saveName} disabled={pending} aria-label="Save name">
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setNameValue(name); }} aria-label="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
}
