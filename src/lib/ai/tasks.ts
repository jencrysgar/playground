import "server-only";
import { runChat, parseJson, MODELS } from "@/lib/ai/providers";
import type {
  AIProvider,
  SearchPick,
  CatalogItem,
  Outline,
} from "@/lib/ai/shared";

export type { SearchPick, CatalogItem, Outline } from "@/lib/ai/shared";

/** Ask a model which catalog items best answer a natural-language question. */
export async function aiSearchPick(
  provider: AIProvider,
  query: string,
  catalog: CatalogItem[],
): Promise<SearchPick[]> {
  const model = provider === "openai" ? MODELS.openaiSearch : MODELS.anthropicSearch;
  const system =
    "You are a helpful search assistant for an AI knowledge base. You are given a user's question and a JSON catalog of items (courses, skills, prompts, agents). " +
    "Pick only the items that genuinely help answer the question, most relevant first. " +
    'Respond as JSON: {"results":[{"id":"<item id>","reason":"<one short sentence why it fits>"}]}. ' +
    "If nothing fits, return an empty results array.";
  const user = `Question: ${query}\n\nCatalog:\n${JSON.stringify(catalog)}`;
  const raw = await runChat(provider, { model, system, user, json: true, maxTokens: 900 });
  const parsed = parseJson<{ results?: SearchPick[] }>(raw);
  return (parsed.results ?? []).filter((r) => r && r.id).slice(0, 25);
}

/** Turn raw course material into a proposed course outline. */
export async function aiOutline(
  provider: AIProvider,
  material: string,
): Promise<Outline> {
  const model = provider === "openai" ? MODELS.openaiImport : MODELS.anthropicImport;
  const system =
    "You are an instructional designer. Convert the provided raw course material (which may be HTML or plain text) into a clean, well-structured course outline. " +
    "Group content into logical modules, each with lessons. Write clear lesson content in plain text (you may rephrase and tidy the source). " +
    'Respond as JSON with this exact shape: {"title":"...","description":"...","modules":[{"title":"...","description":"...","lessons":[{"title":"...","content":"..."}]}]}.';
  const user = `Raw material:\n\n${material.slice(0, 16000)}`;
  const raw = await runChat(provider, { model, system, user, json: true, maxTokens: 3000 });
  const parsed = parseJson<Outline>(raw);
  return {
    title: parsed.title || "Untitled course",
    description: parsed.description || "",
    modules: (parsed.modules ?? []).map((m) => ({
      title: m.title || "Module",
      description: m.description || "",
      lessons: (m.lessons ?? []).map((l) => ({
        title: l.title || "Lesson",
        content: l.content || "",
      })),
    })),
  };
}
