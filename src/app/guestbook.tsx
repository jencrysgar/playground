"use client";

import { useState } from "react";
import type { Message } from "@/lib/messages";

export default function Guestbook({
  initialMessages,
}: {
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessages((prev) => [data.message, ...prev]);
      setText("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Sign the guestbook</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              required
              className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="text" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hello, world!"
              required
              rows={3}
              className="resize-none rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-fit items-center justify-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post message"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          Messages{" "}
          <span className="text-sm font-normal text-foreground/50">
            ({messages.length})
          </span>
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No messages yet. Be the first!
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-foreground/10 bg-background p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{m.name}</span>
                  <time className="text-xs text-foreground/50">
                    {new Date(m.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{m.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
