import Link from "next/link";
import { Lightbulb, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPrompts, tagsFor, promptUsageFor } from "@/lib/content";
import { canEditContent } from "@/lib/permissions";
import { ensureSection } from "@/lib/access";
import { Card, PageHeader, TagPill, EmptyState, LinkButton } from "@/components/ui";
import { PromptCopyButton } from "@/components/app/prompt-actions";

export default async function PromptsPage() {
  const user = (await getCurrentUser())!;
  await ensureSection(user, "prompts");
  const canEdit = canEditContent(user.role);
  const prompts = await getPrompts(user);
  const tagMap = await tagsFor("prompt", prompts.map((p) => p.id));
  const usage = await promptUsageFor(user.id, prompts.map((p) => p.id));

  return (
    <div>
      <PageHeader
        title="Prompts"
        description="A library of ready-to-use prompts. Copy or open them in your AI tool."
        icon={<Lightbulb className="h-5 w-5" />}
        actions={
          canEdit ? (
            <LinkButton href="/prompts/new" size="sm">
              <Plus className="h-4 w-4" /> New prompt
            </LinkButton>
          ) : undefined
        }
      />
      {prompts.length === 0 ? (
        <EmptyState title="No prompts yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prompts.map((p) => (
            <Card key={p.id} className="flex h-full flex-col gap-3">
              <Link href={`/prompts/${p.slug}`} className="flex flex-col gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="text-sm text-muted">{p.description}</p>
              </Link>
              <p className="line-clamp-2 rounded-xl glass-2 p-3 font-mono text-xs text-muted">
                {p.body}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(tagMap[p.id] ?? []).map((t) => (
                  <TagPill key={t.id} name={t.name} color={t.color} />
                ))}
              </div>
              <div className="mt-auto pt-1">
                <PromptCopyButton
                  promptId={p.id}
                  text={p.body}
                  initialCount={usage[p.id] ?? 0}
                  label="Copy prompt"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
