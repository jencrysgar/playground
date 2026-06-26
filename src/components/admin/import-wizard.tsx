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
import { inlineImages } from "@/lib/import-inline";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB per image
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20 MB total inlined

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

function readAsText(file: File): Promise<string> {
  return file.text();
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isTextFile(f: File): boolean {
  return /\.(html?|md|markdown|txt)$/i.test(f.name) || /^text\//.test(f.type);
}
function isImageFile(f: File): boolean {
  return /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f.name);
}

/** Recursively collect files from a drop, including dropped folders. */
async function gatherFiles(dt: DataTransfer): Promise<File[]> {
  const items = dt.items ? Array.from(dt.items) : [];
  const getEntry = (it: DataTransferItem) =>
    (it as unknown as { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.() ?? null;

  if (items.length && items.some((it) => getEntry(it))) {
    const files: File[] = [];
    const walk = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const file = await new Promise<File>((res, rej) =>
          (entry as FileSystemFileEntry).file(res, rej),
        );
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const readBatch = () =>
          new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        let batch = await readBatch();
        while (batch.length) {
          for (const e of batch) await walk(e);
          batch = await readBatch();
        }
      }
    };
    for (const it of items) {
      const entry = getEntry(it);
      if (entry) await walk(entry);
    }
    if (files.length) return files;
  }
  return Array.from(dt.files);
}

export function ImportWizard() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [outlines, setOutlines] = useState<{ openai: OutlineResult; anthropic: OutlineResult } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [pending, startTransition] = useTransition();

  function loadText(text: string, name: string, note?: string | null) {
    setContent(text);
    setFileName(name);
    setTitle(deriveTitle(text, name.replace(/\.[^.]+$/, "") || "Imported course"));
    setNotice(note ?? null);
    setOutlines(null);
  }

  async function processFiles(files: File[]) {
    if (files.length === 0) return;
    const textFile = files.find(isTextFile) ?? files.find((f) => !isImageFile(f));
    if (!textFile) {
      setNotice("Add an .html, .md, or .txt file — images can be dropped alongside it.");
      return;
    }
    const text = await readAsText(textFile);

    // Build a basename -> data URI map from any dropped image files.
    const imageFiles = files.filter(isImageFile);
    const map: Record<string, string> = {};
    let total = 0;
    let skipped = 0;
    for (const img of imageFiles) {
      if (img.size > MAX_IMAGE_BYTES || total + img.size > MAX_TOTAL_BYTES) {
        skipped++;
        continue;
      }
      try {
        map[img.name.toLowerCase()] = await readAsDataUrl(img);
        total += img.size;
      } catch {
        skipped++;
      }
    }

    const isHtml = /\.html?$/i.test(textFile.name) || /<\w+[\s>]/.test(text);
    let finalText = text;
    const notes: string[] = [];
    if (isHtml && imageFiles.length) {
      const result = inlineImages(text, map);
      finalText = result.html;
      if (result.replaced) notes.push(`Embedded ${result.replaced} image${result.replaced === 1 ? "" : "s"}.`);
      if (result.unresolved.length) notes.push(`${result.unresolved.length} image reference(s) had no matching file.`);
    } else if (imageFiles.length && !isHtml) {
      notes.push("Images are only inlined for HTML files.");
    }
    if (skipped) notes.push(`${skipped} image(s) skipped (over size limit).`);

    loadText(finalText, textFile.name, notes.join(" ") || null);
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
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const files = await gatherFiles(e.dataTransfer);
          if (files.length) processFiles(files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition",
          dragOver ? "border-[var(--ring)] bg-primary/5" : "border-border glass-2",
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="font-medium">Drag & drop a saved webpage, folder, or document</p>
        <p className="text-sm text-muted">
          Drop the .html plus its image files (or the whole saved-page folder) to keep images.
          You can also paste content below.
        </p>
        <label className="cursor-pointer">
          <span className="inline-flex h-9 items-center rounded-xl glass px-4 text-sm font-medium ring-focus transition hover:border-[var(--ring)]">
            Choose files
          </span>
          <input
            type="file"
            multiple
            accept=".html,.htm,.md,.markdown,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg,.avif,text/html,text/plain,image/*"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              if (files.length) processFiles(files);
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
          {notice && (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>
          )}

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
