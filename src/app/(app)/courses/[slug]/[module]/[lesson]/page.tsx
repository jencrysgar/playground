import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, BookOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLesson } from "@/lib/content";
import { canEditContent } from "@/lib/permissions";
import { sanitizeImportedHtml } from "@/lib/sanitize";
import { PageHeader, LinkButton } from "@/components/ui";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; module: string; lesson: string }>;
}) {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const user = (await getCurrentUser())!;
  const canEdit = canEditContent(user.role);
  const data = await getLesson(slug, moduleSlug, lessonSlug, user);
  if (!data) notFound();
  const { course, module: mod, lesson } = data;

  const path = `/courses/${slug}/${moduleSlug}/${lessonSlug}`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/courses/${course.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {course.title}
      </Link>

      <PageHeader
        title={lesson.title}
        description={`${mod.title} · ${course.title}`}
        icon={<BookOpen className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <FavoriteInline path={path} title={lesson.title} />
            {canEdit && (
              <LinkButton href={`/courses/${slug}/edit`} variant="secondary" size="sm">
                Edit in course editor
              </LinkButton>
            )}
          </div>
        }
      />

      {lesson.contentFormat === "html" ? (
        <article
          className="rich-content glass glow rounded-2xl p-6 text-[15px] leading-relaxed text-foreground/90"
          dangerouslySetInnerHTML={{ __html: sanitizeImportedHtml(lesson.content) }}
        />
      ) : (
        <article className="glass glow rounded-2xl p-6 text-[15px] leading-relaxed text-foreground/90">
          {lesson.content.split("\n").map((para, i) => (
            <p key={i} className="mb-4 last:mb-0">
              {para}
            </p>
          ))}
        </article>
      )}

      <PageNote path={path} title={lesson.title} />
    </div>
  );
}
