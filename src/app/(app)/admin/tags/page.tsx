import { Tags, GraduationCap, Wand2, Lightbulb, Bot } from "lucide-react";
import { prisma } from "@/lib/db";
import { tagsFor } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { TagManager, TagAssigner } from "@/components/admin/tag-manager";

export default async function AdminTagsPage() {
  const [tags, courses, skills, prompts, agents] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
    prisma.skill.findMany({ orderBy: { title: "asc" } }),
    prisma.prompt.findMany({ orderBy: { title: "asc" } }),
    prisma.agent.findMany({ orderBy: { title: "asc" } }),
  ]);

  const allTags = tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  const [courseTags, skillTags, promptTags, agentTags] = await Promise.all([
    tagsFor("course", courses.map((c) => c.id)),
    tagsFor("skill", skills.map((s) => s.id)),
    tagsFor("prompt", prompts.map((p) => p.id)),
    tagsFor("agent", agents.map((a) => a.id)),
  ]);

  const sections = [
    { type: "course", label: "Courses", icon: GraduationCap, items: courses, tagMap: courseTags },
    { type: "skill", label: "Skills", icon: Wand2, items: skills, tagMap: skillTags },
    { type: "prompt", label: "Prompts", icon: Lightbulb, items: prompts, tagMap: promptTags },
    { type: "agent", label: "Agents", icon: Bot, items: agents, tagMap: agentTags },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tags"
        description="Create tags, then assign one or more to any content so members can filter and search."
        icon={<Tags className="h-5 w-5" />}
      />

      <TagManager tags={allTags} />

      {sections.map((sec) => {
        const Icon = sec.icon;
        return (
          <section key={sec.type} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <Icon className="h-4 w-4" /> {sec.label}
            </h2>
            {sec.items.map((item) => (
              <div key={item.id} className="glass glow flex flex-col gap-2 rounded-2xl p-4">
                <p className="font-medium">{item.title}</p>
                <TagAssigner
                  entityType={sec.type}
                  entityId={item.id}
                  allTags={allTags}
                  assigned={(sec.tagMap[item.id] ?? []).map((t) => t.id)}
                />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
