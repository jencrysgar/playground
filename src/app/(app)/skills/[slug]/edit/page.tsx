import { redirect, notFound } from "next/navigation";
import { Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SkillForm } from "@/components/edit/forms";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/skills");
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) notFound();
  return (
    <div>
      <PageHeader title="Edit skill" description={skill.title} icon={<Wand2 className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <SkillForm init={skill} />
      </div>
    </div>
  );
}
