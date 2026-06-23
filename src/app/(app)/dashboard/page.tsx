import Link from "next/link";
import {
  GraduationCap,
  Wand2,
  Lightbulb,
  Bot,
  Library,
  Star,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCourses, getSkills, getPrompts, getAgents } from "@/lib/content";
import { allowedSections } from "@/lib/access";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

type NewItem = {
  type: "course" | "skill" | "prompt" | "agent";
  title: string;
  href: string;
  createdAt: Date;
};

const typeMeta = {
  course: { icon: GraduationCap, label: "Course" },
  skill: { icon: Wand2, label: "Skill" },
  prompt: { icon: Lightbulb, label: "Prompt" },
  agent: { icon: Bot, label: "Agent" },
};

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;

  const [courses, skills, prompts, agents, favorites, links, sections] =
    await Promise.all([
      getCourses(user),
      getSkills(user),
      getPrompts(user),
      getAgents(user),
      prisma.favorite.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.link.count({ where: { userId: user.id } }),
      allowedSections(user),
    ]);

  const sec = new Set<string>(sections);

  const allStats = [
    { key: "courses", label: "Courses", value: courses.length, href: "/courses", icon: GraduationCap },
    { key: "skills", label: "Skills", value: skills.length, href: "/skills", icon: Wand2 },
    { key: "prompts", label: "Prompts", value: prompts.length, href: "/prompts", icon: Lightbulb },
    { key: "agents", label: "Agents", value: agents.length, href: "/agents", icon: Bot },
    { key: "library", label: "Saved links", value: links, href: "/library", icon: Library },
  ];
  const stats = allStats.filter((s) => sec.has(s.key));

  // "Newly added" — most recent content the user can access.
  const newly: NewItem[] = [
    ...(sec.has("courses") ? courses.map((c) => ({ type: "course" as const, title: c.title, href: `/courses/${c.slug}`, createdAt: c.createdAt })) : []),
    ...(sec.has("skills") ? skills.map((s) => ({ type: "skill" as const, title: s.title, href: `/skills/${s.slug}`, createdAt: s.createdAt })) : []),
    ...(sec.has("prompts") ? prompts.map((p) => ({ type: "prompt" as const, title: p.title, href: `/prompts/${p.slug}`, createdAt: p.createdAt })) : []),
    ...(sec.has("agents") ? agents.map((a) => ({ type: "agent" as const, title: a.title, href: `/agents/${a.slug}`, createdAt: a.createdAt })) : []),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl glass glow p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-sm text-muted">Welcome back,</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {user.name.split(" ")[0]} <span className="text-gradient">👋</span>
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Your AI knowledge hub — everything you have access to, in one place.
        </p>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <Link key={s.key} href={s.href}>
              <Card className="flex flex-col gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Newly added */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Newly added</h2>
        </div>
        {newly.length === 0 ? (
          <Card glow={false} className="glow">
            <p className="text-sm text-muted">Nothing here yet — new content will show up here.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newly.map((item) => {
              const meta = typeMeta[item.type];
              const Icon = meta.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="flex h-full items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] uppercase tracking-wide text-muted">{meta.label}</span>
                      <p className="truncate font-medium">{item.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {item.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Favorites + featured prompts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {sec.has("favorites") && (
          <Card glow={false} className="glow">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold">Recent favorites</h2>
            </div>
            {favorites.length === 0 ? (
              <p className="text-sm text-muted">
                No favorites yet. Tap the star on any page to save it here.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {favorites.map((f) => (
                  <li key={f.id}>
                    <Link href={f.path} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                      <span className="truncate">{f.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/favorites" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              View all favorites →
            </Link>
          </Card>
        )}

        {sec.has("prompts") && (
          <Card glow={false} className="glow">
            <h2 className="mb-4 font-semibold">Featured prompts</h2>
            {prompts.length === 0 ? (
              <p className="text-sm text-muted">No prompts available.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {prompts.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link href={`/prompts/${p.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                      <span className="truncate">{p.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/prompts" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Browse prompts →
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
