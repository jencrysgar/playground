import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getPrompt } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/app/copy-button";
import { OpenInLLM } from "@/components/app/open-in-llm";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = userRole((await getCurrentUser())!);
  const prompt = await getPrompt(slug, role);
  if (!prompt) notFound();
  const path = `/prompts/${prompt.slug}`;

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

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={prompt.body} label="Copy prompt" />
        <OpenInLLM text={prompt.body} />
      </div>

      <PageNote path={path} title={prompt.title} />
    </div>
  );
}
