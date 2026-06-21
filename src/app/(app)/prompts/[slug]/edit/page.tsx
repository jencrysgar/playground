import { redirect, notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { PromptForm } from "@/components/edit/forms";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) redirect("/prompts");
  const { slug } = await params;
  const prompt = await prisma.prompt.findUnique({ where: { slug } });
  if (!prompt) notFound();
  return (
    <div>
      <PageHeader title="Edit prompt" description={prompt.title} icon={<Lightbulb className="h-5 w-5" />} />
      <div className="glass glow rounded-2xl p-6">
        <PromptForm init={prompt} />
      </div>
    </div>
  );
}
