// Shared AI types/constants safe to import from client OR server components.
// (No "server-only" here — see providers.ts for the server-only API callers.)

export type AIProvider = "openai" | "anthropic";

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Claude (Anthropic)",
};

export type SearchPick = { id: string; reason: string };

export type CatalogItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  snippet?: string;
};

export type OutlineLesson = { title: string; content: string };
export type OutlineModule = {
  title: string;
  description: string;
  lessons: OutlineLesson[];
};
export type Outline = {
  title: string;
  description: string;
  modules: OutlineModule[];
};
