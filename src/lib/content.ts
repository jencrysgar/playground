import "server-only";
import { prisma } from "@/lib/db";
import { canAccess, type Role } from "@/lib/permissions";

export type TagLite = { id: string; name: string; color: string };

/** Roles a given role can access (for DB `in` filters). */
function accessibleRoles(role: Role): string[] {
  if (role === "ADMIN") return ["USER", "EDITOR", "ADMIN"];
  if (role === "EDITOR") return ["USER", "EDITOR"];
  return ["USER"];
}

export async function tagsFor(
  entityType: string,
  entityIds: string[],
): Promise<Record<string, TagLite[]>> {
  if (entityIds.length === 0) return {};
  const assignments = await prisma.tagAssignment.findMany({
    where: { entityType, entityId: { in: entityIds } },
    include: { tag: true },
  });
  const map: Record<string, TagLite[]> = {};
  for (const a of assignments) {
    (map[a.entityId] ??= []).push({
      id: a.tag.id,
      name: a.tag.name,
      color: a.tag.color,
    });
  }
  return map;
}

export async function getCourses(role: Role) {
  return prisma.course.findMany({
    where: { accessRole: { in: accessibleRoles(role) } },
    orderBy: { title: "asc" },
    include: { modules: { include: { lessons: true } } },
  });
}

export async function getCourse(slug: string, role: Role) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course || !canAccess(role, course.accessRole)) return null;
  return course;
}

export async function getLesson(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  role: Role,
) {
  const course = await getCourse(courseSlug, role);
  if (!course) return null;
  const mod = course.modules.find((m) => m.slug === moduleSlug);
  const lesson = mod?.lessons.find((l) => l.slug === lessonSlug);
  if (!mod || !lesson) return null;
  return { course, module: mod, lesson };
}

export async function getSkills(role: Role) {
  return prisma.skill.findMany({
    where: { accessRole: { in: accessibleRoles(role) } },
    orderBy: { title: "asc" },
  });
}
export async function getSkill(slug: string, role: Role) {
  const s = await prisma.skill.findUnique({ where: { slug } });
  if (!s || !canAccess(role, s.accessRole)) return null;
  return s;
}

export async function getPrompts(role: Role) {
  return prisma.prompt.findMany({
    where: { accessRole: { in: accessibleRoles(role) } },
    orderBy: { title: "asc" },
  });
}
export async function getPrompt(slug: string, role: Role) {
  const p = await prisma.prompt.findUnique({ where: { slug } });
  if (!p || !canAccess(role, p.accessRole)) return null;
  return p;
}

export async function getAgents(role: Role) {
  return prisma.agent.findMany({
    where: { accessRole: { in: accessibleRoles(role) } },
    orderBy: { title: "asc" },
  });
}
export async function getAgent(slug: string, role: Role) {
  const a = await prisma.agent.findUnique({ where: { slug } });
  if (!a || !canAccess(role, a.accessRole)) return null;
  return a;
}

export type SearchResult = {
  type: "course" | "skill" | "prompt" | "agent";
  id: string;
  title: string;
  description: string;
  href: string;
  tags: TagLite[];
};

export async function search(
  role: Role,
  query: string,
  tagId?: string,
): Promise<SearchResult[]> {
  const roles = accessibleRoles(role);
  const q = query.trim().toLowerCase();

  let allowedByTag: Set<string> | null = null;
  if (tagId) {
    const assignments = await prisma.tagAssignment.findMany({
      where: { tagId },
    });
    allowedByTag = new Set(assignments.map((a) => `${a.entityType}:${a.entityId}`));
  }

  const [courses, skills, prompts, agents] = await Promise.all([
    prisma.course.findMany({ where: { accessRole: { in: roles } } }),
    prisma.skill.findMany({ where: { accessRole: { in: roles } } }),
    prisma.prompt.findMany({ where: { accessRole: { in: roles } } }),
    prisma.agent.findMany({ where: { accessRole: { in: roles } } }),
  ]);

  const tagMaps = {
    course: await tagsFor("course", courses.map((c) => c.id)),
    skill: await tagsFor("skill", skills.map((s) => s.id)),
    prompt: await tagsFor("prompt", prompts.map((p) => p.id)),
    agent: await tagsFor("agent", agents.map((a) => a.id)),
  };

  const results: SearchResult[] = [];
  const matchText = (...fields: string[]) =>
    !q || fields.some((f) => f.toLowerCase().includes(q));
  const matchTag = (type: string, id: string) =>
    !allowedByTag || allowedByTag.has(`${type}:${id}`);

  for (const c of courses) {
    if (matchText(c.title, c.description) && matchTag("course", c.id)) {
      results.push({ type: "course", id: c.id, title: c.title, description: c.description, href: `/courses/${c.slug}`, tags: tagMaps.course[c.id] ?? [] });
    }
  }
  for (const s of skills) {
    if (matchText(s.title, s.description, s.content) && matchTag("skill", s.id)) {
      results.push({ type: "skill", id: s.id, title: s.title, description: s.description, href: `/skills/${s.slug}`, tags: tagMaps.skill[s.id] ?? [] });
    }
  }
  for (const p of prompts) {
    if (matchText(p.title, p.description, p.body) && matchTag("prompt", p.id)) {
      results.push({ type: "prompt", id: p.id, title: p.title, description: p.description, href: `/prompts/${p.slug}`, tags: tagMaps.prompt[p.id] ?? [] });
    }
  }
  for (const a of agents) {
    if (matchText(a.title, a.description, a.content) && matchTag("agent", a.id)) {
      results.push({ type: "agent", id: a.id, title: a.title, description: a.description, href: `/agents/${a.slug}`, tags: tagMaps.agent[a.id] ?? [] });
    }
  }
  return results;
}
