import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { PromptForm } from "@/components/edit/forms";

export default async function NewPromptPage() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/prompts");
  return (
    <div>
      <PageHeader title="New prompt" description="Create a new prompt." icon={<Lightbulb className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <PromptForm />
      </div>
    </div>
  );
}
