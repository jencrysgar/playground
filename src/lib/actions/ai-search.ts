"use server";

import { getCurrentUser } from "@/lib/auth";
import { getCourses, getSkills, getPrompts, getAgents, tagsFor, type TagLite } from "@/lib/content";
import { aiSearchPick, type CatalogItem } from "@/lib/ai/tasks";
import { PROVIDER_LABELS, AIError, type AIProvider } from "@/lib/ai/providers";
import { enforceAiLimit, RateLimitError } from "@/lib/ai/limits";

const SEARCH_PROVIDER: AIProvider =
  process.env.AI_SEARCH_PROVIDER === "anthropic" ? "anthropic" : "openai";

export type AiSearchResult = {
  type: string;
  title: string;
  description: string;
  href: string;
  reason: string;
  tags: TagLite[];
};

export type AiSearchState =
  | { results: AiSearchResult[]; answeredBy: string; error?: undefined }
  | { error: string; results?: undefined }
  | undefined;

export async function aiSearchAction(query: string): Promise<AiSearchState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  const q = query.trim();
  if (!q) return { results: [], answeredBy: PROVIDER_LABELS[SEARCH_PROVIDER] };

  const [courses, skills, prompts, agents] = await Promise.all([
    getCourses(user),
    getSkills(user),
    getPrompts(user),
    getAgents(user),
  ]);

  const [courseTags, skillTags, promptTags, agentTags] = await Promise.all([
    tagsFor("course", courses.map((c) => c.id)),
    tagsFor("skill", skills.map((s) => s.id)),
    tagsFor("prompt", prompts.map((p) => p.id)),
    tagsFor("agent", agents.map((a) => a.id)),
  ]);

  const catalog: CatalogItem[] = [];
  const lookup = new Map<string, AiSearchResult>();

  const add = (
    type: string,
    id: string,
    title: string,
    description: string,
    snippet: string,
    href: string,
    tags: TagLite[],
  ) => {
    const key = `${type}:${id}`;
    catalog.push({ id: key, type, title, description, snippet: snippet.slice(0, 240) });
    lookup.set(key, { type, title, description, href, reason: "", tags });
  };

  for (const c of courses) add("course", c.id, c.title, c.description, c.outcomes, `/courses/${c.slug}`, courseTags[c.id] ?? []);
  for (const s of skills) add("skill", s.id, s.title, s.description, `${s.problem} ${s.whatYouGet} ${s.corePrompt}`, `/skills/${s.slug}`, skillTags[s.id] ?? []);
  for (const p of prompts) add("prompt", p.id, p.title, p.description, p.body, `/prompts/${p.slug}`, promptTags[p.id] ?? []);
  for (const a of agents) add("agent", a.id, a.title, a.description, a.platform, `/agents/${a.slug}`, agentTags[a.id] ?? []);

  try {
    await enforceAiLimit(user.id, "search");
    const picks = await aiSearchPick(SEARCH_PROVIDER, q, catalog);
    const results: AiSearchResult[] = [];
    for (const pick of picks) {
      const base = lookup.get(pick.id);
      if (base) results.push({ ...base, reason: pick.reason ?? "" });
    }
    return { results, answeredBy: PROVIDER_LABELS[SEARCH_PROVIDER] };
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    if (e instanceof AIError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "AI search failed." };
  }
}
