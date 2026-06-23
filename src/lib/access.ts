import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export type AccessUser = { id: string; role: string; accessMode: string };

export type SectionKey =
  | "search"
  | "courses"
  | "skills"
  | "prompts"
  | "agents"
  | "library"
  | "favorites"
  | "notes";

export const ALL_SECTIONS: SectionKey[] = [
  "search",
  "courses",
  "skills",
  "prompts",
  "agents",
  "library",
  "favorites",
  "notes",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  search: "Search",
  courses: "Courses",
  skills: "Skills",
  prompts: "Prompts",
  agents: "Agents",
  library: "URL Library",
  favorites: "Favorites",
  notes: "Notes",
};

export type Visibility =
  | { mode: "all" }
  | {
      mode: "custom";
      sections: Set<SectionKey>;
      lessons: Set<string>;
      skills: Set<string>;
      prompts: Set<string>;
      agents: Set<string>;
    };

/**
 * Compute what a user may see. "all" mode (the default) sees everything their
 * role allows. "custom" mode sees only explicitly-granted sections and items;
 * a course/module grant expands to its lessons.
 */
export async function getVisibility(user: AccessUser): Promise<Visibility> {
  if (user.accessMode !== "custom") return { mode: "all" };

  const [sectionRows, grants] = await Promise.all([
    prisma.userSection.findMany({ where: { userId: user.id } }),
    prisma.accessGrant.findMany({ where: { userId: user.id } }),
  ]);

  const sections = new Set(sectionRows.map((r) => r.section as SectionKey));
  const courseIds: string[] = [];
  const moduleIds: string[] = [];
  const lessons = new Set<string>();
  const skills = new Set<string>();
  const prompts = new Set<string>();
  const agents = new Set<string>();

  for (const g of grants) {
    switch (g.resourceType) {
      case "course": courseIds.push(g.resourceId); break;
      case "module": moduleIds.push(g.resourceId); break;
      case "lesson": lessons.add(g.resourceId); break;
      case "skill": skills.add(g.resourceId); break;
      case "prompt": prompts.add(g.resourceId); break;
      case "agent": agents.add(g.resourceId); break;
    }
  }

  if (courseIds.length || moduleIds.length) {
    const expanded = await prisma.lesson.findMany({
      where: {
        OR: [{ module: { courseId: { in: courseIds } } }, { moduleId: { in: moduleIds } }],
      },
      select: { id: true },
    });
    for (const l of expanded) lessons.add(l.id);
  }

  return { mode: "custom", sections, lessons, skills, prompts, agents };
}

export function canSection(vis: Visibility, section: SectionKey): boolean {
  return vis.mode === "all" || vis.sections.has(section);
}

export async function allowedSections(user: AccessUser): Promise<SectionKey[]> {
  const vis = await getVisibility(user);
  if (vis.mode === "all") return ALL_SECTIONS;
  return ALL_SECTIONS.filter((s) => vis.sections.has(s));
}

/** Redirect to the dashboard if the user can't access a section. */
export async function ensureSection(user: AccessUser, section: SectionKey) {
  const vis = await getVisibility(user);
  if (!canSection(vis, section)) redirect("/dashboard");
}
