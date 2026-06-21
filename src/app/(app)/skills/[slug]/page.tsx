import { notFound } from "next/navigation";
import { Wand2 } from "lucide-react";
import { getCurrentUser, userRole } from "@/lib/auth";
import { getSkill } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/app/copy-button";
import { OpenInLLM } from "@/components/app/open-in-llm";
import { FavoriteInline, PageNote } from "@/components/app/page-personal";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = userRole((await getCurrentUser())!);
  const skill = await getSkill(slug, role);
  if (!skill) notFound();
  const path = `/skills/${skill.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={skill.title}
        description={skill.description}
        icon={<Wand2 className="h-5 w-5" />}
        actions={<FavoriteInline path={path} title={skill.title} />}
      />
      <article className="glass glow rounded-2xl p-6 text-[15px] leading-relaxed text-foreground/90">
        {skill.content.split("\n").map((para, i) => (
          <p key={i} className="mb-4 last:mb-0">{para}</p>
        ))}
      </article>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={skill.content} label="Copy skill" />
        <OpenInLLM text={skill.content} />
      </div>
      <PageNote path={path} title={skill.title} />
    </div>
  );
}
