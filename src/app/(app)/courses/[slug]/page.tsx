import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, BookOpen, Clock, ListChecks } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCourse } from "@/lib/content";
import { canEditContent } from "@/lib/permissions";
import { PageHeader, Card, Section, Prose, BulletList } from "@/components/ui";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";
import { EditBar } from "@/components/edit/content-controls";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = (await getCurrentUser())!;
  const course = await getCourse(slug, user);
  if (!course) notFound();
  const path = `/courses/${course.slug}`;
  const canEdit = canEditContent(user.role);
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={course.title}
        description={course.description}
        icon={<GraduationCap className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <FavoriteInline path={path} title={course.title} />
            {canEdit && <EditBar editHref={`${path}/edit`} type="course" id={course.id} />}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Meta icon={<Clock className="h-4 w-4" />} label={course.length || `${lessonCount} lessons`} />
        <Meta icon={<BookOpen className="h-4 w-4" />} label={`${course.modules.length} modules · ${lessonCount} lessons`} />
        <Meta icon={<ListChecks className="h-4 w-4" />} label={course.level} />
      </div>

      {course.outcomes && (
        <Section title="What you'll learn">
          <BulletList text={course.outcomes} />
        </Section>
      )}
      {course.prerequisites && (
        <Section title="Prerequisites">
          <Prose text={course.prerequisites} />
        </Section>
      )}

      <div className="flex flex-col gap-4">
        {course.modules.map((m, i) => (
          <Card key={m.id} glow={false} className="glow">
            <div className="mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-primary">
                Module {i + 1}
              </span>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="text-sm text-muted">{m.description}</p>
            </div>
            <ul className="flex flex-col gap-1">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/courses/${course.slug}/${m.slug}/${l.slug}`}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
                  >
                    <BookOpen className="h-4 w-4 text-muted" />
                    {l.title}
                  </Link>
                </li>
              ))}
              {m.lessons.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">No lessons yet.</li>
              )}
            </ul>
          </Card>
        ))}
      </div>

      <PageNote path={path} title={course.title} />
    </div>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl glass-2 px-3 py-1.5 text-sm text-foreground/80">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}
