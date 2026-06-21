import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { CourseForm } from "@/components/edit/forms";

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/courses");
  return (
    <div>
      <PageHeader title="New course" description="Create a course, then add modules and lessons." icon={<GraduationCap className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <CourseForm />
      </div>
    </div>
  );
}
