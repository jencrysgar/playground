import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, BookOpen } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getCourse } from "@/lib/content";
import { PageHeader, Card } from "@/components/ui";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = userRole((await getCurrentUser())!);
  const course = await getCourse(slug, role);
  if (!course) notFound();

  const path = `/courses/${course.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={course.title}
        description={course.description}
        icon={<GraduationCap className="h-5 w-5" />}
        actions={<FavoriteInline path={path} title={course.title} />}
      />

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
            </ul>
          </Card>
        ))}
      </div>

      <PageNote path={path} title={course.title} />
    </div>
  );
}
