"use client";

import { useState, useTransition } from "react";
import { UploadCloud, FileText, Sparkles, Check, AlertTriangle } from "lucide-react";
import { Button, Input, cn } from "@/components/ui";
import {
  proposeOutlines,
  createCourseAsIs,
  createCourseFromOutline,
  type OutlineResult,
} from "@/lib/actions/import";
import { PROVIDER_LABELS, type Outline } from "@/lib/ai/shared";

function deriveTitle(content: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const doc = new DOMParser().parseFromString(content, "text/html");
    const h1 = doc.querySelector("h1")?.textContent?.trim();
    const t = doc.querySelector("title")?.textContent?.trim();
    return h1 || t || fallback;
  } catch {
    return fallback;
  }
}

export function ImportWizard() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [outlines, setOutlines] = useState<{ openai: OutlineResult; anthropic: OutlineResult } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [pending, startTransition] = useTransition();

  function loadText(text: string, name: string) {
    setContent(text);
    setFileName(name);
    setTitle(deriveTitle(text, name.replace(/\.[^.]+$/, "") || "Imported course"));
    setOutlines(null);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    loadText(text, file.name);
  }

  async function generate() {
    setThinking(true);
    setOutlines(null);
    const res = await proposeOutlines(content);
    setOutlines(res);
    setThinking(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition",
          dragOver ? "border-[var(--ring)] bg-primary/5" : "border-border glass-2",
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="font-medium">Drag & drop a saved webpage or document</p>
        <p className="text-sm text-muted">.html, .htm, .md, or .txt — or paste the content below</p>
        <label className="cursor-pointer">
          <span className="inline-flex h-9 items-center rounded-xl glass px-4 text-sm font-medium ring-focus transition hover:border-[var(--ring)]">
            Choose a file
          </span>
          <input
            type="file"
            accept=".html,.htm,.md,.markdown,.txt,text/html,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>

      <details className="glass-2 rounded-xl p-4">
        <summary className="cursor-pointer text-sm font-medium">Or paste content</summary>
        <textarea
          value={content}
          onChange={(e) => loadText(e.target.value, fileName || "Pasted content")}
          rows={6}
          placeholder="Paste HTML or text here…"
          className="mt-3 w-full rounded-xl glass-2 px-3.5 py-2.5 font-mono text-xs ring-focus"
        />
      </details>

      {content && (
        <div className="glass glow flex flex-col gap-4 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <FileText className="h-4 w-4" />
            {fileName || "Pasted content"} · {content.length.toLocaleString()} characters
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Course title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => startTransition(() => createCourseAsIs(title, content))}
            >
              <Check className="h-4 w-4" /> Load as-is
            </Button>
            <Button onClick={generate} disabled={thinking}>
              <Sparkles className="h-4 w-4" />
              {thinking ? "Generating with OpenAI & Claude…" : "Generate AI outlines (compare)"}
            </Button>
          </div>
          <p className="text-xs text-muted">
            <strong>Load as-is</strong> keeps your original formatting (headers, images, embedded
            video). <strong>Generate AI outlines</strong> asks both OpenAI and Claude to propose a
            structured course so you can pick the one you prefer.
          </p>
        </div>
      )}

      {(thinking || outlines) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <OutlineColumn provider="openai" result={outlines?.openai} loading={thinking} pending={pending} startTransition={startTransition} />
          <OutlineColumn provider="anthropic" result={outlines?.anthropic} loading={thinking} pending={pending} startTransition={startTransition} />
        </div>
      )}
    </div>
  );
}

function OutlineColumn({
  provider,
  result,
  loading,
  pending,
  startTransition,
}: {
  provider: "openai" | "anthropic";
  result: OutlineResult | undefined;
  loading: boolean;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  return (
    <div className="glass glow flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{PROVIDER_LABELS[provider]}</h3>
      </div>

      {loading ? (
        <p className="animate-pulse text-sm text-muted">Generating a proposed outline…</p>
      ) : !result ? null : !result.ok ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{result.error}</span>
        </div>
      ) : (
        <OutlinePreview outline={result.outline} pending={pending} startTransition={startTransition} />
      )}
    </div>
  );
}

function OutlinePreview({
  outline,
  pending,
  startTransition,
}: {
  outline: Outline;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const lessonCount = outline.modules.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-semibold">{outline.title}</p>
        <p className="text-sm text-muted">{outline.description}</p>
        <p className="mt-1 text-xs text-muted">
          {outline.modules.length} modules · {lessonCount} lessons
        </p>
      </div>
      <div className="max-h-72 overflow-auto rounded-xl glass-2 p-3">
        {outline.modules.map((m, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <p className="text-sm font-medium">{m.title}</p>
            <ul className="ml-3 mt-1 list-disc text-sm text-muted">
              {m.lessons.map((l, j) => (
                <li key={j}>{l.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => createCourseFromOutline(outline))}
      >
        <Check className="h-4 w-4" /> Use this outline
      </Button>
    </div>
  );
}
