"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";
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

function UsageBadge({ count }: { count: number }) {
  if (count <= 0) return <span className="text-xs text-muted">Not used yet</span>;
  return (
    <span className="text-xs text-muted">
      Used {count} {count === 1 ? "time" : "times"}
    </span>
  );
}

/** Copy-from-card/detail button that records a usage and shows the count. */
export function PromptCopyButton({
  promptId,
  text,
  initialCount,
  label = "Copy",
  size = "sm",
  showCount = true,
}: {
  promptId: string;
  text: string;
  initialCount: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(initialCount);

  async function handleCopy() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    setCount((c) => c + 1); // optimistic
    const res = await recordPromptUse(promptId);
    if (res.count) setCount(res.count);
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant={copied ? "secondary" : "primary"} size={size} onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied!" : label}
      </Button>
      {showCount && <UsageBadge count={count} />}
    </div>
  );
}

/** Full action row for the prompt detail page: copy + open-in-LLM + usage count. */
export function PromptDetailActions({
  promptId,
  text,
  initialCount,
}: {
  promptId: string;
  text: string;
  initialCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(initialCount);
  const encoded = encodeURIComponent(text);

  async function bump() {
    setCount((c) => c + 1);
    const res = await recordPromptUse(promptId);
    if (res.count) setCount(res.count);
  }

  async function handleCopy() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    await bump();
  }

  const targets = [
    { label: "Open in ChatGPT", href: `https://chatgpt.com/?q=${encoded}` },
    { label: "Open in Claude", href: `https://claude.ai/new?q=${encoded}` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={copied ? "secondary" : "primary"} onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy prompt"}
        </Button>
        {targets.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void bump()}
            className="inline-flex h-10 items-center gap-2 rounded-xl glass px-4 text-sm font-medium ring-focus transition hover:border-[var(--ring)]"
          >
            <ExternalLink className="h-4 w-4" />
            {t.label}
          </a>
        ))}
      </div>
      <UsageBadge count={count} />
    </div>
  );
}
