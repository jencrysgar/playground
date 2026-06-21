import { StickyNote } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { NotesList } from "@/components/app/notes-list";

export default async function NotesPage() {
  const user = (await getCurrentUser())!;
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My Notes"
        description="Private notes you've added across the knowledge center."
        icon={<StickyNote className="h-5 w-5" />}
      />
      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Open any course, skill, prompt, or agent and add a private note."
        />
      ) : (
        <NotesList
          notes={notes.map((n) => ({
            id: n.id,
            path: n.path,
            title: n.title,
            content: n.content,
            updatedAt: n.updatedAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
