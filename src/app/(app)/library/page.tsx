import { Library } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureSection } from "@/lib/access";
import { PageHeader } from "@/components/ui";
import { LibraryManager } from "@/components/app/library-manager";

export default async function LibraryPage() {
  const user = (await getCurrentUser())!;
  await ensureSection(user, "library");
  const links = await prisma.link.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });

  return (
    <div>
      <PageHeader
        title="URL Library"
        description="Save, tag, and revisit your favorite AI links — your personal Raindrop."
        icon={<Library className="h-5 w-5" />}
      />
      <LibraryManager
        links={links.map((l) => ({
          id: l.id,
          url: l.url,
          title: l.title,
          description: l.description,
          tags: l.tags.map((t) => t.name),
        }))}
      />
    </div>
  );
}
