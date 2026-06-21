"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";

export type SaveState = { error?: string } | undefined;

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) {
    throw new Error("Editor access required");
  }
  return user;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base || "item";
  let slug = root;
  let n = 2;
  while (await exists(slug)) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// ---------- Courses ----------

export async function saveCourse(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireEditor();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };
  const data = {
    title,
    description: str(fd, "description"),
    length: str(fd, "length"),
    level: str(fd, "level") || "Beginner",
    outcomes: str(fd, "outcomes"),
    prerequisites: str(fd, "prerequisites"),
    accessRole: str(fd, "accessRole") || "USER",
  };
  let slug: string;
  if (id) {
    const updated = await prisma.course.update({ where: { id }, data });
    slug = updated.slug;
  } else {
    slug = await uniqueSlug(slugify(title), async (s) =>
      Boolean(await prisma.course.findUnique({ where: { slug: s } })),
    );
    await prisma.course.create({ data: { ...data, slug } });
  }
  revalidatePath("/courses");
  redirect(`/courses/${slug}`);
}

export async function deleteCourse(id: string) {
  await requireEditor();
  await prisma.course.delete({ where: { id } });
  revalidatePath("/courses");
  redirect("/courses");
}

// ---------- Modules ----------

export async function saveModule(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireEditor();
  const id = str(fd, "id");
  const courseId = str(fd, "courseId");
  const title = str(fd, "title");
  if (!title) return { error: "Module title is required." };
  const data = {
    title,
    description: str(fd, "description"),
    order: Number(str(fd, "order")) || 0,
  };
  if (id) {
    await prisma.module.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(slugify(title), async (s) =>
      Boolean(
        await prisma.module.findUnique({
          where: { courseId_slug: { courseId, slug: s } },
        }),
      ),
    );
    await prisma.module.create({ data: { ...data, slug, courseId } });
  }
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { modules: { some: { id } } }] },
  });
  if (course) revalidatePath(`/courses/${course.slug}/edit`);
  return undefined;
}

export async function deleteModule(id: string) {
  await requireEditor();
  await prisma.module.delete({ where: { id } });
}

// ---------- Lessons ----------

export async function saveLesson(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireEditor();
  const id = str(fd, "id");
  const moduleId = str(fd, "moduleId");
  const title = str(fd, "title");
  if (!title) return { error: "Lesson title is required." };
  const data = {
    title,
    content: str(fd, "content"),
    order: Number(str(fd, "order")) || 0,
  };
  if (id) {
    await prisma.lesson.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(slugify(title), async (s) =>
      Boolean(
        await prisma.lesson.findUnique({
          where: { moduleId_slug: { moduleId, slug: s } },
        }),
      ),
    );
    await prisma.lesson.create({ data: { ...data, slug, moduleId } });
  }
  return undefined;
}

export async function deleteLesson(id: string) {
  await requireEditor();
  await prisma.lesson.delete({ where: { id } });
}

// ---------- Skills ----------

export async function saveSkill(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireEditor();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };
  const data = {
    title,
    description: str(fd, "description"),
    problem: str(fd, "problem"),
    whatYouGet: str(fd, "whatYouGet"),
    howItWorks: str(fd, "howItWorks"),
    howToTrigger: str(fd, "howToTrigger"),
    worksWith: str(fd, "worksWith"),
    corePrompt: str(fd, "corePrompt"),
    promptNotes: str(fd, "promptNotes"),
    accessRole: str(fd, "accessRole") || "USER",
  };
  let slug: string;
  if (id) {
    slug = (await prisma.skill.update({ where: { id }, data })).slug;
  } else {
    slug = await uniqueSlug(slugify(title), async (s) =>
      Boolean(await prisma.skill.findUnique({ where: { slug: s } })),
    );
    await prisma.skill.create({ data: { ...data, slug } });
  }
  revalidatePath("/skills");
  redirect(`/skills/${slug}`);
}

export async function deleteSkill(id: string) {
  await requireEditor();
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/skills");
  redirect("/skills");
}

// ---------- Prompts ----------

export async function savePrompt(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireEditor();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };
  const data = {
    title,
    description: str(fd, "description"),
    howToUse: str(fd, "howToUse"),
    body: str(fd, "body"),
    extraTitle: str(fd, "extraTitle"),
    extraContent: str(fd, "extraContent"),
    accessRole: str(fd, "accessRole") || "USER",
  };
  let slug: string;
  if (id) {
    slug = (await prisma.prompt.update({ where: { id }, data })).slug;
  } else {
    slug = await uniqueSlug(slugify(title), async (s) =>
      Boolean(await prisma.prompt.findUnique({ where: { slug: s } })),
    );
    await prisma.prompt.create({ data: { ...data, slug } });
  }
  revalidatePath("/prompts");
  redirect(`/prompts/${slug}`);
}

export async function deletePrompt(id: string) {
  await requireEditor();
  await prisma.prompt.delete({ where: { id } });
  revalidatePath("/prompts");
  redirect("/prompts");
}

// ---------- Agents ----------

export async function saveAgent(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireEditor();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };
  const data = {
    title,
    description: str(fd, "description"),
    url: str(fd, "url"),
    platform: str(fd, "platform"),
    accessRole: str(fd, "accessRole") || "USER",
  };
  let slug: string;
  if (id) {
    slug = (await prisma.agent.update({ where: { id }, data })).slug;
  } else {
    slug = await uniqueSlug(slugify(title), async (s) =>
      Boolean(await prisma.agent.findUnique({ where: { slug: s } })),
    );
    await prisma.agent.create({ data: { ...data, slug } });
  }
  revalidatePath("/agents");
  redirect(`/agents/${slug}`);
}

export async function deleteAgent(id: string) {
  await requireEditor();
  await prisma.agent.delete({ where: { id } });
  revalidatePath("/agents");
  redirect("/agents");
}
