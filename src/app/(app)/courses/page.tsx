import Link from "next/link";
import { GraduationCap, Layers } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getCourses, tagsFor } from "@/lib/content";
import { Card, PageHeader, TagPill, EmptyState } from "@/components/ui";

export default async function CoursesPage() {
  const role = userRole((await getCurrentUser())!);
  const courses = await getCourses(role);
  const tagMap = await tagsFor("course", courses.map((c) => c.id));

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Structured learning paths made of modules and lessons."
        icon={<GraduationCap className="h-5 w-5" />}
      />
      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Check back soon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => {
            const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
            return (
              <Link key={c.id} href={`/courses/${c.slug}`}>
                <Card className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Layers className="h-3.5 w-3.5" />
                      {c.modules.length} modules · {lessonCount} lessons
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted">{c.description}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {(tagMap[c.id] ?? []).map((t) => (
                      <TagPill key={t.id} name={t.name} color={t.color} />
                    ))}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
