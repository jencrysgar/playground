"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Save, RotateCcw, UserPen } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { saveUserPromptCopy } from "@/lib/actions/user-prompt";
import { recordPromptUse } from "@/lib/actions/prompt-usage";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export function MyPromptVersion({
  targetType,
  targetId,
  original,
  initialCopy,
  revalidate,
  usagePromptId,
}: {
  targetType: "prompt" | "skill";
  targetId: string;
  original: string;
  initialCopy: string | null;
  revalidate?: string;
  usagePromptId?: string;
}) {
  const [text, setText] = useState(initialCopy ?? original);
  const [hasCustom, setHasCustom] = useState(Boolean(initialCopy));
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleCopy() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (usagePromptId) await recordPromptUse(usagePromptId);
  }

  function save() {
    startTransition(async () => {
      await saveUserPromptCopy(targetType, targetId, text, revalidate);
      setHasCustom(Boolean(text.trim()));
      setStatus("Saved your version");
      setTimeout(() => setStatus(null), 1800);
    });
  }

  function reset() {
    startTransition(async () => {
      await saveUserPromptCopy(targetType, targetId, "", revalidate);
      setText(original);
      setHasCustom(false);
      setStatus("Reset to original");
      setTimeout(() => setStatus(null), 1800);
    });
  }

  return (
    <div className="glass glow rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <UserPen className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Your version</h3>
        {hasCustom && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            Customized
          </span>
        )}
        <span className="ml-auto text-xs text-muted">Private to you</span>
      </div>
      <p className="mb-3 text-sm text-muted">
        Edit this prompt to fit your needs and save your own copy. Your changes
        don&apos;t affect anyone else.
      </p>
      <Textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-mono"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={copied ? "secondary" : "primary"} onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy my version"}
        </Button>
        <Button size="sm" variant="secondary" onClick={save} disabled={pending}>
          <Save className="h-4 w-4" /> Save my version
        </Button>
        {hasCustom && (
          <Button size="sm" variant="ghost" onClick={reset} disabled={pending}>
            <RotateCcw className="h-4 w-4" /> Reset to original
          </Button>
        )}
        {status && <span className="text-sm text-emerald-500">{status}</span>}
      </div>
    </div>
  );
}
