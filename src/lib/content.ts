import "server-only";
import { prisma } from "@/lib/db";
import { canAccess, type Role } from "@/lib/permissions";
import { getVisibility, type AccessUser, type Visibility } from "@/lib/access";

export type TagLite = { id: string; name: string; color: string };

function roleOf(user: AccessUser): Role {
  return (user.role as Role) ?? "USER";
}

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

type CourseWithModules = Awaited<ReturnType<typeof fetchCourses>>[number];

function fetchCourses(roles: string[]) {
  return prisma.course.findMany({
    where: { accessRole: { in: roles } },
    orderBy: { title: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
}

/** Trim a course's modules/lessons to only those visible in custom mode. */
function applyCourseVisibility(course: CourseWithModules, vis: Visibility) {
  if (vis.mode === "all") return course;
  const modules = course.modules
    .map((m) => ({ ...m, lessons: m.lessons.filter((l) => vis.lessons.has(l.id)) }))
    .filter((m) => m.lessons.length > 0);
  return { ...course, modules };
}

export async function getCourses(user: AccessUser) {
  const vis = await getVisibility(user);
  const courses = await fetchCourses(accessibleRoles(roleOf(user)));
  if (vis.mode === "all") return courses;
  return courses
    .map((c) => applyCourseVisibility(c, vis))
    .filter((c) => c.modules.length > 0);
}

export async function getCourse(slug: string, user: AccessUser) {
  const vis = await getVisibility(user);
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course || !canAccess(roleOf(user), course.accessRole)) return null;
  if (vis.mode === "all") return course;
  const trimmed = applyCourseVisibility(course, vis);
  return trimmed.modules.length > 0 ? trimmed : null;
}

export async function getLesson(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  user: AccessUser,
) {
  const course = await getCourse(courseSlug, user);
  if (!course) return null;
  const mod = course.modules.find((m) => m.slug === moduleSlug);
  const lesson = mod?.lessons.find((l) => l.slug === lessonSlug);
  if (!mod || !lesson) return null;
  return { course, module: mod, lesson };
}

export async function getSkills(user: AccessUser) {
  const vis = await getVisibility(user);
  const skills = await prisma.skill.findMany({
    where: { accessRole: { in: accessibleRoles(roleOf(user)) } },
    orderBy: { title: "asc" },
  });
  return vis.mode === "all" ? skills : skills.filter((s) => vis.skills.has(s.id));
}
export async function getSkill(slug: string, user: AccessUser) {
  const vis = await getVisibility(user);
  const s = await prisma.skill.findUnique({ where: { slug } });
  if (!s || !canAccess(roleOf(user), s.accessRole)) return null;
  if (vis.mode === "custom" && !vis.skills.has(s.id)) return null;
  return s;
}

export async function getPrompts(user: AccessUser) {
  const vis = await getVisibility(user);
  const prompts = await prisma.prompt.findMany({
    where: { accessRole: { in: accessibleRoles(roleOf(user)) } },
    orderBy: { title: "asc" },
  });
  return vis.mode === "all" ? prompts : prompts.filter((p) => vis.prompts.has(p.id));
}
export async function getPrompt(slug: string, user: AccessUser) {
  const vis = await getVisibility(user);
  const p = await prisma.prompt.findUnique({ where: { slug } });
  if (!p || !canAccess(roleOf(user), p.accessRole)) return null;
  if (vis.mode === "custom" && !vis.prompts.has(p.id)) return null;
  return p;
}

/** Map of promptId -> usage count for a specific user. */
export async function promptUsageFor(
  userId: string,
  promptIds: string[],
): Promise<Record<string, number>> {
  if (promptIds.length === 0) return {};
  const usages = await prisma.promptUsage.findMany({
    where: { userId, promptId: { in: promptIds } },
  });
  const map: Record<string, number> = {};
  for (const u of usages) map[u.promptId] = u.count;
  return map;
}

export async function getAgents(user: AccessUser) {
  const vis = await getVisibility(user);
  const agents = await prisma.agent.findMany({
    where: { accessRole: { in: accessibleRoles(roleOf(user)) } },
    orderBy: { title: "asc" },
  });
  return vis.mode === "all" ? agents : agents.filter((a) => vis.agents.has(a.id));
}
export async function getAgent(slug: string, user: AccessUser) {
  const vis = await getVisibility(user);
  const a = await prisma.agent.findUnique({ where: { slug } });
  if (!a || !canAccess(roleOf(user), a.accessRole)) return null;
  if (vis.mode === "custom" && !vis.agents.has(a.id)) return null;
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
  user: AccessUser,
  query: string,
  tagId?: string,
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();

  let allowedByTag: Set<string> | null = null;
  if (tagId) {
    const assignments = await prisma.tagAssignment.findMany({ where: { tagId } });
    allowedByTag = new Set(assignments.map((a) => `${a.entityType}:${a.entityId}`));
  }

  // Reuse the access-aware getters so search only covers what the user can see.
  const [courses, skills, prompts, agents] = await Promise.all([
    getCourses(user),
    getSkills(user),
    getPrompts(user),
    getAgents(user),
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
    if (matchText(s.title, s.description, s.problem, s.whatYouGet, s.corePrompt) && matchTag("skill", s.id)) {
      results.push({ type: "skill", id: s.id, title: s.title, description: s.description, href: `/skills/${s.slug}`, tags: tagMaps.skill[s.id] ?? [] });
    }
  }
  for (const p of prompts) {
    if (matchText(p.title, p.description, p.body) && matchTag("prompt", p.id)) {
      results.push({ type: "prompt", id: p.id, title: p.title, description: p.description, href: `/prompts/${p.slug}`, tags: tagMaps.prompt[p.id] ?? [] });
    }
  }
  for (const a of agents) {
    if (matchText(a.title, a.description, a.platform) && matchTag("agent", a.id)) {
      results.push({ type: "agent", id: a.id, title: a.title, description: a.description, href: `/agents/${a.slug}`, tags: tagMaps.agent[a.id] ?? [] });
    }
  }
  return results;
}
