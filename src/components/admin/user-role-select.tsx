"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/lib/actions/admin";
import { cn } from "@/components/ui";

const ROLES = ["USER", "EDITOR", "ADMIN"] as const;

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled?: boolean;
}) {
  const [current, setCurrent] = useState(role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-xl glass-2 p-1">
        {ROLES.map((r) => (
          <button
            key={r}
            disabled={disabled || pending}
            onClick={() => {
              const prev = current;
              setCurrent(r);
              setError(null);
              startTransition(async () => {
                const res = await setUserRole(userId, r);
                if (res?.error) {
                  setCurrent(prev);
                  setError(res.error);
                }
              });
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50",
              current === r ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
}
