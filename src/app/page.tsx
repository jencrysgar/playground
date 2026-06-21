import Guestbook from "./guestbook";
import { getMessages } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default function Home() {
  const initialMessages = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium tracking-wide text-foreground/70 ring-1 ring-foreground/10">
          Next.js · TypeScript · Tailwind CSS
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your new app is live
        </h1>
        <p className="text-base text-foreground/70">
          This starter includes a full-stack feature: the guestbook below talks
          to an API route at{" "}
          <code className="font-mono text-sm">/api/messages</code>. Sign it to
          confirm everything works end to end.
        </p>
      </header>

      <Guestbook initialMessages={initialMessages} />
    </main>
  );
}
