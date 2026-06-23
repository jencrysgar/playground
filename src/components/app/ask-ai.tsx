"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, GraduationCap, Wand2, Lightbulb, Bot, CornerDownLeft } from "lucide-react";
import { Button, TagPill, cn } from "@/components/ui";
import { aiSearchAction, type AiSearchState } from "@/lib/actions/ai-search";

const typeIcon: Record<string, React.ElementType> = {
  course: GraduationCap,
  skill: Wand2,
  prompt: Lightbulb,
  agent: Bot,
};

const EXAMPLES = [
  "Is there a prompt that helps me write a blog post?",
  "How do I get better at prompting?",
  "Something to review my code",
];

export function AskAi() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AiSearchState>(undefined);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    setQuery(question);
    setLoading(true);
    setState(undefined);
    const res = await aiSearchAction(question);
    setState(res);
    setLoading(false);
  }

  return (
    <div className="glass glow rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Ask AI</h2>
        <span className="text-xs text-muted">Ask in plain language — AI finds what you can access.</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Is there a prompt that summarizes documents?"
            className="w-full rounded-xl glass-2 py-2.5 pl-3.5 pr-10 text-sm ring-focus"
          />
          <CornerDownLeft className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Thinking…" : "Ask"}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => ask(ex)}
            className="rounded-full glass-2 px-3 py-1 text-xs text-muted transition hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && (
        <p className="mt-4 animate-pulse text-sm text-muted">Searching your knowledge base…</p>
      )}

      {state?.error && (
        <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{state.error}</p>
      )}

      {state?.results && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted">
            {state.results.length === 0
              ? "No matches found."
              : `${state.results.length} result${state.results.length === 1 ? "" : "s"}`}
            {state.answeredBy ? ` · answered by ${state.answeredBy}` : ""}
          </p>
          {state.results.map((r) => {
            const Icon = typeIcon[r.type] ?? Lightbulb;
            return (
              <Link key={r.href} href={r.href}>
                <div className="glass-2 glow-hover flex items-start gap-3 rounded-xl p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.title}</span>
                      <span className={cn("rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted")}>
                        {r.type}
                      </span>
                    </div>
                    {r.reason && <p className="text-sm text-foreground/80">{r.reason}</p>}
                    {r.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <TagPill key={t.id} name={t.name} color={t.color} />
                        ))}
                      </div>
                    )}
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
