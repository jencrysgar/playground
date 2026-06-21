"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sun, Moon, Monitor, Home, User as UserIcon } from "lucide-react";
import { Button, Input, Label, cn } from "@/components/ui";
import {
  setDefaultLanding,
  setThemePreference,
  updateProfile,
} from "@/lib/actions/settings";

const LANDING_OPTIONS = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/courses", label: "Courses" },
  { value: "/skills", label: "Skills" },
  { value: "/prompts", label: "Prompts" },
  { value: "/agents", label: "Agents" },
  { value: "/library", label: "URL Library" },
  { value: "/favorites", label: "Favorites" },
  { value: "/notes", label: "Notes" },
];

export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <div className="glass glow rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <UserIcon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">Profile</h3>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button
          onClick={() =>
            startTransition(async () => {
              await updateProfile(value);
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
              router.refresh();
            })
          }
          disabled={pending}
        >
          {saved ? "Saved" : pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

export function DefaultLandingSelect({ current }: { current: string }) {
  const [value, setValue] = useState(current);
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <div className="glass glow rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Default landing page</h3>
          <p className="text-sm text-muted">Where you go right after signing in.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {LANDING_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              setValue(o.value);
              startTransition(async () => {
                await setDefaultLanding(o.value);
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              });
            }}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium ring-focus transition",
              value === o.value ? "bg-primary text-primary-foreground halo-btn" : "glass-2 text-muted hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {saved && <p className="mt-2 text-sm text-emerald-500">Saved</p>}
    </div>
  );
}

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="glass glow rounded-2xl p-5">
      <h3 className="mb-1 font-semibold">Appearance</h3>
      <p className="mb-4 text-sm text-muted">Choose how the app looks.</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const Icon = o.icon;
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              onClick={() => {
                setTheme(o.value);
                void setThemePreference(o.value);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ring-focus transition",
                active ? "bg-primary text-primary-foreground halo-btn" : "glass-2 text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
