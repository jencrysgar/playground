"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Tags, StickyNote, UploadCloud } from "lucide-react";
import { cn } from "@/components/ui";

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin", label: "Overview", icon: Shield, show: true },
    { href: "/admin/import", label: "Import", icon: UploadCloud, show: true },
    { href: "/admin/users", label: "Users", icon: Users, show: isAdmin },
    { href: "/admin/tags", label: "Tags", icon: Tags, show: true },
    { href: "/admin/notes", label: "All Notes", icon: StickyNote, show: isAdmin },
  ].filter((t) => t.show);

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ring-focus transition",
              active ? "bg-primary text-primary-foreground halo-btn" : "glass text-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
