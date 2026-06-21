import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { CourseForm } from "@/components/edit/forms";
import { CourseModulesEditor } from "@/components/edit/course-modules-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/courses");
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to course
      </Link>
      <PageHeader title="Edit course" description={course.title} icon={<GraduationCap className="h-5 w-5" />} />

      <div className="glass glow rounded-2xl p-6">
        <CourseForm init={course} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Modules & lessons
        </h2>
        <CourseModulesEditor
          courseId={course.id}
          modules={course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            order: m.order,
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              content: l.content,
              order: l.order,
            })),
          }))}
        />
      </div>
    </div>
  );
}
