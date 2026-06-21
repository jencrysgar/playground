import Link from "next/link";
import { Wand2, Plus } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getSkills, tagsFor } from "@/lib/content";
import { canEditContent } from "@/lib/permissions";
import { Card, PageHeader, TagPill, EmptyState, LinkButton } from "@/components/ui";

export default async function SkillsPage() {
  const user = (await getCurrentUser())!;
  const role = userRole(user);
  const canEdit = canEditContent(user.role);
  const skills = await getSkills(role);
  const tagMap = await tagsFor("skill", skills.map((s) => s.id));

  return (
    <div>
      <PageHeader
        title="Skills"
        description="Reusable techniques to get more out of AI tools."
        icon={<Wand2 className="h-5 w-5" />}
        actions={
          canEdit ? (
            <LinkButton href="/skills/new" size="sm">
              <Plus className="h-4 w-4" /> New skill
            </LinkButton>
          ) : undefined
        }
      />
      {skills.length === 0 ? (
        <EmptyState title="No skills yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {skills.map((s) => (
            <Link key={s.id} href={`/skills/${s.slug}`}>
              <Card className="flex h-full flex-col gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Wand2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted">{s.description}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {(tagMap[s.id] ?? []).map((t) => (
                    <TagPill key={t.id} name={t.name} color={t.color} />
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
