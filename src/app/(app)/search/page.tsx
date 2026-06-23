import Link from "next/link";
import { Search as SearchIcon, GraduationCap, Wand2, Lightbulb, Bot } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { search } from "@/lib/content";
import { prisma } from "@/lib/db";
import { ensureSection } from "@/lib/access";
import { PageHeader, TagPill, EmptyState, cn } from "@/components/ui";
import { AskAi } from "@/components/app/ask-ai";

const typeIcon = {
  course: GraduationCap,
  skill: Wand2,
  prompt: Lightbulb,
  agent: Bot,
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q = "", tag = "" } = await searchParams;
  const user = (await getCurrentUser())!;
  await ensureSection(user, "search");
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const results = q || tag ? await search(user, q, tag || undefined) : [];

  return (
    <div>
      <PageHeader
        title="Search"
        description="Ask AI a question, or search by word, phrase, and tags."
        icon={<SearchIcon className="h-5 w-5" />}
      />

      <div className="mb-6">
        <AskAi />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Or search by keyword & tag
      </h2>

      <form method="get" className="mb-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search courses, skills, prompts, agents…"
            className="w-full rounded-xl glass-2 py-3 pl-10 pr-3 text-sm ring-focus"
          />
        </div>
        {tag && <input type="hidden" name="tag" value={tag} />}
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">Filter by tag:</span>
        <Link
          href={`/search?q=${encodeURIComponent(q)}`}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium ring-1 transition",
            !tag ? "bg-primary text-primary-foreground ring-transparent" : "glass-2 text-muted ring-border hover:text-foreground",
          )}
        >
          All
        </Link>
        {tags.map((t) => (
          <Link
            key={t.id}
            href={`/search?q=${encodeURIComponent(q)}&tag=${t.id}`}
            className={cn(tag === t.id && "ring-2 ring-[var(--ring)] rounded-full")}
          >
            <TagPill name={t.name} color={t.color} />
          </Link>
        ))}
      </div>

      {!q && !tag ? (
        <EmptyState title="Start typing to search" description="Or pick a tag to browse." />
      ) : results.length === 0 ? (
        <EmptyState title="No matches" description="Try a different word or tag." />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{results.length} result{results.length === 1 ? "" : "s"}</p>
          {results.map((r) => {
            const Icon = typeIcon[r.type];
            return (
              <Link key={`${r.type}-${r.id}`} href={r.href}>
                <div className="glass glow glow-hover flex items-start gap-3 rounded-2xl p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.title}</span>
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
                        {r.type}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted">{r.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <TagPill key={t.id} name={t.name} color={t.color} />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
