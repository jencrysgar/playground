import { notFound } from "next/navigation";
import { Bot } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getAgent } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/app/copy-button";
import { OpenInLLM } from "@/components/app/open-in-llm";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = userRole((await getCurrentUser())!);
  const agent = await getAgent(slug, role);
  if (!agent) notFound();
  const path = `/agents/${agent.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={agent.title}
        description={agent.description}
        icon={<Bot className="h-5 w-5" />}
        actions={<FavoriteInline path={path} title={agent.title} />}
      />
      <article className="glass glow rounded-2xl p-6 text-[15px] leading-relaxed text-foreground/90">
        {agent.content.split("\n").map((para, i) => (
          <p key={i} className="mb-4 last:mb-0">{para}</p>
        ))}
      </article>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={agent.content} label="Copy agent" />
        <OpenInLLM text={agent.content} />
      </div>
      <PageNote path={path} title={agent.title} />
    </div>
  );
}
