import "server-only";
import type { AIProvider } from "@/lib/ai/shared";

export type { AIProvider } from "@/lib/ai/shared";
export { PROVIDER_LABELS } from "@/lib/ai/shared";

export const MODELS = {
  openaiSearch: process.env.OPENAI_SEARCH_MODEL || "gpt-4o-mini",
  openaiImport: process.env.OPENAI_IMPORT_MODEL || "gpt-4o",
  anthropicImport: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  anthropicSearch: process.env.ANTHROPIC_SEARCH_MODEL || "claude-sonnet-4-6",
};

export class AIError extends Error {
  provider: AIProvider;
  constructor(provider: AIProvider, message: string) {
    super(message);
    this.provider = provider;
    this.name = "AIError";
  }
}

type ChatOpts = {
  model: string;
  system: string;
  user: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
};

const TIMEOUT_MS = 60_000;

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(opts: ChatOpts): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AIError("openai", "OpenAI API key is not configured.");
  const data = await withTimeout(async (signal) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: opts.model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1500,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = json?.error?.code;
      if (code === "insufficient_quota") {
        throw new AIError(
          "openai",
          "OpenAI quota exceeded — add billing/credit to your OpenAI account to enable this.",
        );
      }
      throw new AIError("openai", json?.error?.message || `OpenAI request failed (${res.status}).`);
    }
    return json;
  });
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(opts: ChatOpts): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AIError("anthropic", "Anthropic API key is not configured.");
  const data = await withTimeout(async (signal) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens ?? 1500,
        temperature: opts.temperature ?? 0.2,
        system: opts.system + (opts.json ? "\n\nRespond with ONLY valid JSON, no prose or code fences." : ""),
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new AIError("anthropic", json?.error?.message || `Anthropic request failed (${res.status}).`);
    }
    return json;
  });
  return data?.content?.[0]?.text ?? "";
}

export async function runChat(provider: AIProvider, opts: ChatOpts): Promise<string> {
  return provider === "openai" ? callOpenAI(opts) : callAnthropic(opts);
}

/** Parse a JSON object out of a model response, tolerating code fences/extra prose. */
export function parseJson<T>(raw: string): T {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  return JSON.parse(text) as T;
}
