import { notFound } from "next/navigation";
import { Bot, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAgent } from "@/lib/content";
import { canEditContent } from "@/lib/permissions";
import { PageHeader, Section, Prose } from "@/components/ui";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";
import { EditBar } from "@/components/edit/content-controls";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = (await getCurrentUser())!;
  const agent = await getAgent(slug, user);
  if (!agent) notFound();
  const path = `/agents/${agent.slug}`;
  const canEdit = canEditContent(user.role);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={agent.title}
        description={agent.description}
        icon={<Bot className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <FavoriteInline path={path} title={agent.title} />
            {canEdit && <EditBar editHref={`${path}/edit`} type="agent" id={agent.id} />}
          </div>
        }
      />

      {agent.description && (
        <Section title="About this agent">
          <Prose text={agent.description} />
        </Section>
      )}

      <Section title="Launch">
        {agent.url ? (
          <div className="flex flex-col gap-3">
            {agent.platform && (
              <span className="inline-flex w-fit items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                {agent.platform}
              </span>
            )}
            <a
              href={agent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground halo-btn ring-focus transition hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              Open agent
            </a>
            <span className="break-all text-xs text-muted">{agent.url}</span>
          </div>
        ) : (
          <p className="text-sm text-muted">No link has been added for this agent yet.</p>
        )}
      </Section>

      <PageNote path={path} title={agent.title} />
    </div>
  );
}
