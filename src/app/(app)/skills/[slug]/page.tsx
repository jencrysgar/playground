import { notFound } from "next/navigation";
import { Wand2, Zap } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getSkill } from "@/lib/content";
import { getUserPromptCopy } from "@/lib/personal";
import { canEditContent } from "@/lib/permissions";
import { PageHeader, Section, Prose } from "@/components/ui";
import { CopyButton } from "@/components/app/copy-button";
import { OpenInLLM } from "@/components/app/open-in-llm";
import { MyPromptVersion } from "@/components/app/my-prompt-version";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";
import { EditBar } from "@/components/edit/content-controls";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = (await getCurrentUser())!;
  const role = userRole(user);
  const skill = await getSkill(slug, role);
  if (!skill) notFound();
  const path = `/skills/${skill.slug}`;
  const canEdit = canEditContent(user.role);
  const myCopy = await getUserPromptCopy("skill", skill.id);
  const worksWith = skill.worksWith.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={skill.title}
        description={skill.description}
        icon={<Wand2 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <FavoriteInline path={path} title={skill.title} />
            {canEdit && <EditBar editHref={`${path}/edit`} type="skill" id={skill.id} />}
          </div>
        }
      />

      {worksWith.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Works with:</span>
          {worksWith.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 rounded-full glass-2 px-3 py-1 text-xs font-medium">
              <Zap className="h-3 w-3 text-primary" />
              {w}
            </span>
          ))}
        </div>
      )}

      {skill.problem && <Section title="The problem"><Prose text={skill.problem} /></Section>}
      {skill.whatYouGet && <Section title="What you get"><Prose text={skill.whatYouGet} /></Section>}
      {skill.howItWorks && <Section title="How it works"><Prose text={skill.howItWorks} /></Section>}
      {skill.howToTrigger && <Section title="How to trigger it"><Prose text={skill.howToTrigger} /></Section>}

      {skill.corePrompt && (
        <Section title="Core prompt">
          <div className="rounded-xl glass-2 p-4">
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground/90">
              {skill.corePrompt}
            </pre>
          </div>
          {skill.promptNotes && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground/90">
              <span className="font-medium text-amber-600">Note: </span>
              {skill.promptNotes}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyButton text={skill.corePrompt} label="Copy core prompt" />
            <OpenInLLM text={skill.corePrompt} />
          </div>
        </Section>
      )}

      {skill.corePrompt && (
        <MyPromptVersion
          targetType="skill"
          targetId={skill.id}
          original={skill.corePrompt}
          initialCopy={myCopy}
          revalidate={path}
        />
      )}

      <PageNote path={path} title={skill.title} />
    </div>
  );
}
