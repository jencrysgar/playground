import { ExternalLink } from "lucide-react";

/**
 * Deep links that prefill a prompt in the user's preferred AI chat tool.
 * ChatGPT and Claude both accept a `q` query param that pre-populates the
 * composer so the user can send it in their own account.
 */
export function OpenInLLM({ text }: { text: string }) {
  const encoded = encodeURIComponent(text);
  const targets = [
    { label: "Open in ChatGPT", href: `https://chatgpt.com/?q=${encoded}` },
    { label: "Open in Claude", href: `https://claude.ai/new?q=${encoded}` },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl glass px-4 text-sm font-medium ring-focus transition hover:border-[var(--ring)]"
        >
          <ExternalLink className="h-4 w-4" />
          {t.label}
        </a>
      ))}
    </div>
  );
}
