"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { sanitizeImportedHtml } from "@/lib/sanitize";
import { aiOutline, type Outline } from "@/lib/ai/tasks";
import { AIError } from "@/lib/ai/providers";
import { enforceAiLimit, RateLimitError } from "@/lib/ai/limits";

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) throw new Error("Editor access required");
  return user;
}

function slugify(input: string): string {
  return (
    input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
    "imported-course"
  );
}

async function uniqueCourseSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await prisma.course.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  return slug;
}

export type OutlineResult = { ok: true; outline: Outline } | { ok: false; error: string };

/** Run BOTH providers in parallel so an admin can compare the outlines. */
export async function proposeOutlines(
  material: string,
): Promise<{ openai: OutlineResult; anthropic: OutlineResult }> {
  const user = await requireEditor();
  try {
    await enforceAiLimit(user.id, "import");
  } catch (e) {
    const msg = e instanceof RateLimitError ? e.message : "Rate limit error.";
    return { openai: { ok: false, error: msg }, anthropic: { ok: false, error: msg } };
  }
  const text = material.slice(0, 20000);

  const run = async (provider: "openai" | "anthropic"): Promise<OutlineResult> => {
    try {
      const outline = await aiOutline(provider, text);
      return { ok: true, outline };
    } catch (e) {
      const msg = e instanceof AIError ? e.message : e instanceof Error ? e.message : "Failed.";
      return { ok: false, error: msg };
    }
  };

  const [openai, anthropic] = await Promise.all([run("openai"), run("anthropic")]);
  return { openai, anthropic };
}

/** Create a course straight from sanitized HTML (one module, one lesson). */
export async function createCourseAsIs(title: string, html: string) {
  await requireEditor();
  const clean = sanitizeImportedHtml(html);
  const courseTitle = title.trim() || "Imported course";
  const slug = await uniqueCourseSlug(slugify(courseTitle));
  await prisma.course.create({
    data: {
      slug,
      title: courseTitle,
      description: "Imported content.",
      length: "",
      level: "Beginner",
      modules: {
        create: [
          {
            slug: "imported",
            title: "Imported content",
            description: "",
            order: 1,
            lessons: {
              create: [
                {
                  slug: "content",
                  title: courseTitle,
                  content: clean,
                  contentFormat: "html",
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });
  revalidatePath("/courses");
  redirect(`/courses/${slug}`);
}

/** Create a course from an AI-proposed outline (plain-text lessons). */
export async function createCourseFromOutline(outline: Outline) {
  await requireEditor();
  const courseTitle = outline.title?.trim() || "Imported course";
  const slug = await uniqueCourseSlug(slugify(courseTitle));
  await prisma.course.create({
    data: {
      slug,
      title: courseTitle,
      description: outline.description ?? "",
      level: "Beginner",
      modules: {
        create: (outline.modules ?? []).map((m, mi) => ({
          slug: `${slugify(m.title)}-${mi + 1}`,
          title: m.title,
          description: m.description ?? "",
          order: mi + 1,
          lessons: {
            create: (m.lessons ?? []).map((l, li) => ({
              slug: `${slugify(l.title)}-${li + 1}`,
              title: l.title,
              content: l.content ?? "",
              contentFormat: "text",
              order: li + 1,
            })),
          },
        })),
      },
    },
  });
  revalidatePath("/courses");
  redirect(`/courses/${slug}`);
}
