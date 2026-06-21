import { redirect, notFound } from "next/navigation";
import { Bot } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AgentForm } from "@/components/edit/forms";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/agents");
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) notFound();
  return (
    <div>
      <PageHeader title="Edit agent" description={agent.title} icon={<Bot className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <AgentForm init={agent} />
      </div>
    </div>
  );
}
