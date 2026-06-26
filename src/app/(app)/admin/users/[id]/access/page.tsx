import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AccessEditor } from "@/components/admin/access-editor";

export default async function UserAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !hasRole(me.role, "ADMIN")) redirect("/admin");
  const { id } = await params;

  const [target, courses, skills, prompts, agents, sections, grants] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
    }),
    prisma.skill.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.prompt.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.agent.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.userSection.findMany({ where: { userId: id } }),
    prisma.accessGrant.findMany({ where: { userId: id } }),
  ]);
  if (!target) notFound();

  const grantsOf = (t: string) => grants.filter((g) => g.resourceType === t).map((g) => g.resourceId);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to users
      </Link>
      <PageHeader
        title={`Access · ${target.name}`}
        description="Choose exactly which sections and items this person can see."
        icon={<ShieldCheck className="h-5 w-5" />}
      />
      <AccessEditor
        userId={target.id}
        userName={target.name}
        initialMode={target.accessMode}
        sections={sections.map((s) => s.section)}
        grantedLessons={grantsOf("lesson")}
        grantedSkills={grantsOf("skill")}
        grantedPrompts={grantsOf("prompt")}
        grantedAgents={grantsOf("agent")}
        courses={courses.map((c) => ({
          id: c.id,
          title: c.title,
          modules: c.modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessons: m.lessons.map((l) => ({ id: l.id, title: l.title })),
          })),
        }))}
        skills={skills}
        prompts={prompts}
        agents={agents}
      />
    </div>
  );
}
