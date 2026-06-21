import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getPrompt, promptUsageFor } from "@/lib/content";
import { getUserPromptCopy } from "@/lib/personal";
import { canEditContent } from "@/lib/permissions";
import { PageHeader, Section, Prose } from "@/components/ui";
import { PromptDetailActions } from "@/components/app/prompt-actions";
import { MyPromptVersion } from "@/components/app/my-prompt-version";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";
import { EditBar } from "@/components/edit/content-controls";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = (await getCurrentUser())!;
  const role = userRole(user);
  const prompt = await getPrompt(slug, role);
  if (!prompt) notFound();
  const path = `/prompts/${prompt.slug}`;
  const canEdit = canEditContent(user.role);
  const usage = await promptUsageFor(user.id, [prompt.id]);
  const myCopy = await getUserPromptCopy("prompt", prompt.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={prompt.title}
        description={prompt.description}
        icon={<Lightbulb className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <FavoriteInline path={path} title={prompt.title} />
            {canEdit && <EditBar editHref={`${path}/edit`} type="prompt" id={prompt.id} />}
          </div>
        }
      />

      {prompt.howToUse && <Section title="How to use"><Prose text={prompt.howToUse} /></Section>}

      <Section title="The prompt">
        <div className="rounded-xl glass-2 p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground/90">
            {prompt.body}
          </pre>
        </div>
        <div className="mt-4">
          <PromptDetailActions
            promptId={prompt.id}
            text={prompt.body}
            initialCount={usage[prompt.id] ?? 0}
          />
        </div>
      </Section>

      {prompt.extraTitle && prompt.extraContent && (
        <Section title={prompt.extraTitle}>
          <Prose text={prompt.extraContent} />
        </Section>
      )}

      <MyPromptVersion
        targetType="prompt"
        targetId={prompt.id}
        original={prompt.body}
        initialCopy={myCopy}
        revalidate={path}
        usagePromptId={prompt.id}
      />

      <PageNote path={path} title={prompt.title} />
    </div>
  );
}
