import Link from "next/link";
import { Bot } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getAgents, tagsFor } from "@/lib/content";
import { Card, PageHeader, TagPill, EmptyState } from "@/components/ui";

export default async function AgentsPage() {
  const role = userRole((await getCurrentUser())!);
  const agents = await getAgents(role);
  const tagMap = await tagsFor("agent", agents.map((a) => a.id));

  return (
    <div>
      <PageHeader
        title="Agents"
        description="Documented agent recipes you can adapt and reuse."
        icon={<Bot className="h-5 w-5" />}
      />
      {agents.length === 0 ? (
        <EmptyState title="No agents yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((a) => (
            <Link key={a.id} href={`/agents/${a.slug}`}>
              <Card className="flex h-full flex-col gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Bot className="h-5 w-5" />
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
