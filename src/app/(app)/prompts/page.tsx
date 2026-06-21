import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getPrompts, tagsFor } from "@/lib/content";
import { Card, PageHeader, TagPill, EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/app/copy-button";

export default async function PromptsPage() {
  const role = userRole((await getCurrentUser())!);
  const prompts = await getPrompts(role);
  const tagMap = await tagsFor("prompt", prompts.map((p) => p.id));

  return (
    <div>
      <PageHeader
        title="Prompts"
        description="A library of ready-to-use prompts. Copy or open them in your AI tool."
        icon={<Lightbulb className="h-5 w-5" />}
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
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {(tagMap[p.id] ?? []).map((t) => (
                    <TagPill key={t.id} name={t.name} color={t.color} />
                  ))}
                </div>
                <CopyButton text={p.body} label="Copy" size="sm" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
