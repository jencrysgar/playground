import Link from "next/link";
import {
  GraduationCap,
  Wand2,
  Lightbulb,
  Bot,
  Library,
  Star,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getCourses, getSkills, getPrompts, getAgents } from "@/lib/content";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const role = userRole(user);

  const [courses, skills, prompts, agents, favorites, links] = await Promise.all([
    getCourses(role),
    getSkills(role),
    getPrompts(role),
    getAgents(role),
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.link.count({ where: { userId: user.id } }),
  ]);

  const stats = [
    { label: "Courses", value: courses.length, href: "/courses", icon: GraduationCap },
    { label: "Skills", value: skills.length, href: "/skills", icon: Wand2 },
    { label: "Prompts", value: prompts.length, href: "/prompts", icon: Lightbulb },
    { label: "Agents", value: agents.length, href: "/agents", icon: Bot },
    { label: "Saved links", value: links, href: "/library", icon: Library },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted">Welcome back,</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {user.name.split(" ")[0]} <span className="text-gradient">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s everything in your knowledge center.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
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

      <div className="grid gap-4 lg:grid-cols-2">
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
                  <Link
                    href={f.path}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                  >
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

        <Card glow={false} className="glow">
          <h2 className="mb-4 font-semibold">Featured prompts</h2>
          {prompts.length === 0 ? (
            <p className="text-sm text-muted">No prompts available.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {prompts.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/prompts/${p.slug}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                  >
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
      </div>
    </div>
  );
}
