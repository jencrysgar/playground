import { redirect } from "next/navigation";
import Link from "next/link";
import { StickyNote, ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function AdminNotesPage() {
  const me = (await getCurrentUser())!;
  if (!hasRole(me.role, "ADMIN")) redirect("/admin");

  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <PageHeader
        title="All Notes"
        description="A read-only view of members' notes, so you can see what people find helpful."
        icon={<StickyNote className="h-5 w-5" />}
      />
      {notes.length === 0 ? (
        <EmptyState title="No notes yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((n) => (
            <div key={n.id} className="glass glow rounded-2xl p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{n.user.name}</span>
                <Link href={n.path} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {n.title || n.path}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground/85">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
