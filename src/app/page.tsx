import { redirect } from "next/navigation";
import {
  Sparkles,
  GraduationCap,
  Wand2,
  Bot,
  Library,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/brand";
import { LinkButton } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: GraduationCap, title: "Courses & Lessons", desc: "Structured learning paths with modules and lessons." },
  { icon: Wand2, title: "Prompts & Skills", desc: "A reusable library you can copy and run in one click." },
  { icon: Bot, title: "Agents", desc: "Document and share agent recipes across your team." },
  { icon: Library, title: "URL Library", desc: "Save and tag links, Raindrop-style." },
  { icon: Star, title: "Favorites & Notes", desc: "Personalize everything and keep private notes." },
  { icon: ShieldCheck, title: "Secure access", desc: "Passkeys, authenticator apps, and SMS 2FA." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.defaultLanding || "/dashboard");

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-5">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LinkButton href="/login" variant="secondary" size="sm">
            Sign in
          </LinkButton>
          <LinkButton href="/signup" size="sm">
            Get started
          </LinkButton>
        </div>
      </header>

      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Your AI knowledge, beautifully organized
        </span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          The home for all your{" "}
          <span className="text-gradient">AI knowledge</span>
        </h1>
        <p className="max-w-xl text-base text-muted sm:text-lg">
          Courses, skills, prompts, agents, and curated links — secured behind
          logins with passkeys and 2FA, and tailored to every member.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/signup" size="lg">
            Create your account
          </LinkButton>
          <LinkButton href="/login" variant="secondary" size="lg">
            I already have one
          </LinkButton>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass glow glow-hover rounded-2xl p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
