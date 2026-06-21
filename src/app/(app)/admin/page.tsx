import Link from "next/link";
import { Users, Tags, StickyNote } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";

export default async function AdminOverviewPage() {
  const user = (await getCurrentUser())!;
  const isAdmin = hasRole(user.role, "ADMIN");

  const [userCount, tagCount, noteCount] = await Promise.all([
    prisma.user.count(),
    prisma.tag.count(),
    prisma.note.count(),
  ]);

  const cards = [
    { href: "/admin/users", label: "Users", value: userCount, icon: Users, desc: "Manage roles & access", show: isAdmin },
    { href: "/admin/tags", label: "Tags", value: tagCount, icon: Tags, desc: "Create & assign tags", show: true },
    { href: "/admin/notes", label: "Notes", value: noteCount, icon: StickyNote, desc: "See what members find useful", show: isAdmin },
  ].filter((c) => c.show);

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Manage users, tags, and review member notes."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="flex flex-col gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="font-medium">{c.label}</div>
              <div className="text-sm text-muted">{c.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
