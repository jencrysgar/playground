import { redirect } from "next/navigation";
import { Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { SkillForm } from "@/components/edit/forms";

export default async function NewSkillPage() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/skills");
  return (
    <div>
      <PageHeader title="New skill" description="Create a new skill." icon={<Wand2 className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <SkillForm />
      </div>
    </div>
  );
}
