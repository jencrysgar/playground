import Link from "next/link";
import { Bot, Plus, ExternalLink } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getAgents, tagsFor } from "@/lib/content";
import { canEditContent } from "@/lib/permissions";
import { Card, PageHeader, TagPill, EmptyState, LinkButton } from "@/components/ui";

export default async function AgentsPage() {
  const user = (await getCurrentUser())!;
  const role = userRole(user);
  const canEdit = canEditContent(user.role);
  const agents = await getAgents(role);
  const tagMap = await tagsFor("agent", agents.map((a) => a.id));

  return (
    <div>
      <PageHeader
        title="Agents"
        description="External Custom GPTs, Claude Projects, and other agents — one click away."
        icon={<Bot className="h-5 w-5" />}
        actions={
          canEdit ? (
            <LinkButton href="/agents/new" size="sm">
              <Plus className="h-4 w-4" /> New agent
            </LinkButton>
          ) : undefined
        }
      />
      {agents.length === 0 ? (
        <EmptyState title="No agents yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((a) => (
            <Link key={a.id} href={`/agents/${a.slug}`}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  {a.platform && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {a.platform}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="text-sm text-muted">{a.description}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {(tagMap[a.id] ?? []).map((t) => (
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
