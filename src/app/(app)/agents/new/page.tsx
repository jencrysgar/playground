import { redirect } from "next/navigation";
import { Bot } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { AgentForm } from "@/components/edit/forms";

export default async function NewAgentPage() {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/agents");
  return (
    <div>
      <PageHeader title="New agent" description="Link to a Custom GPT, Claude Project, etc." icon={<Bot className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <AgentForm />
      </div>
    </div>
  );
}
