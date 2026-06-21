import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getPrompt, promptUsageFor } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { PromptDetailActions } from "@/components/app/prompt-actions";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";

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
  const usage = await promptUsageFor(user.id, [prompt.id]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={prompt.title}
        description={prompt.description}
        icon={<Lightbulb className="h-5 w-5" />}
        actions={<FavoriteInline path={path} title={prompt.title} />}
      />

      <div className="glass glow rounded-2xl p-6">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground/90">
          {prompt.body}
        </pre>
      </div>

      <PromptDetailActions
        promptId={prompt.id}
        text={prompt.body}
        initialCount={usage[prompt.id] ?? 0}
      />

      <PageNote path={path} title={prompt.title} />
    </div>
  );
}
