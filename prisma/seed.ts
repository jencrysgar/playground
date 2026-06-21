import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      email: "admin@akc.dev",
      name: "Avery Admin",
      role: "ADMIN",
      defaultLanding: "/dashboard",
    },
    {
      email: "editor@akc.dev",
      name: "Eden Editor",
      role: "EDITOR",
      defaultLanding: "/dashboard",
    },
    {
      email: "member@akc.dev",
      name: "Morgan Member",
      role: "USER",
      defaultLanding: "/dashboard",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, passwordHash },
    });
  }

  // Tags
  const tags = [
    { name: "Beginner", color: "emerald" },
    { name: "Advanced", color: "rose" },
    { name: "Productivity", color: "blue" },
    { name: "Writing", color: "purple" },
    { name: "Coding", color: "amber" },
    { name: "Research", color: "cyan" },
  ];
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { name: t.name },
      update: { color: t.color },
      create: t,
    });
  }
  const tagByName = Object.fromEntries(
    (await prisma.tag.findMany()).map((t) => [t.name, t]),
  );

  async function assign(name: string, entityType: string, entityId: string) {
    const tag = tagByName[name];
    if (!tag) return;
    await prisma.tagAssignment.upsert({
      where: {
        tagId_entityType_entityId: { tagId: tag.id, entityType, entityId },
      },
      update: {},
      create: { tagId: tag.id, entityType, entityId },
    });
  }

  // Course -> Modules -> Lessons
  const course = await prisma.course.upsert({
    where: { slug: "prompt-engineering-foundations" },
    update: {},
    create: {
      slug: "prompt-engineering-foundations",
      title: "Prompt Engineering Foundations",
      description:
        "Learn how to talk to large language models effectively, from first principles to advanced patterns.",
      accessRole: "USER",
    },
  });
  await assign("Beginner", "course", course.id);
  await assign("Writing", "course", course.id);

  const modulesData = [
    {
      slug: "getting-started",
      title: "Getting Started",
      description: "The mental model behind prompting.",
      order: 1,
      lessons: [
        {
          slug: "what-is-a-prompt",
          title: "What is a prompt?",
          order: 1,
          content:
            "A prompt is the input you give a model. Great prompts are specific, provide context, and state the desired output format. Think of the model as a brilliant but very literal collaborator.",
        },
        {
          slug: "anatomy-of-a-prompt",
          title: "Anatomy of a great prompt",
          order: 2,
          content:
            "Role + Task + Context + Constraints + Output format. Include examples when you can. Iterate: change one variable at a time and compare results.",
        },
      ],
    },
    {
      slug: "advanced-patterns",
      title: "Advanced Patterns",
      description: "Chain-of-thought, few-shot, and tool use.",
      order: 2,
      lessons: [
        {
          slug: "few-shot-prompting",
          title: "Few-shot prompting",
          order: 1,
          content:
            "Show the model 2-5 examples of the input/output you want. The model generalizes from your examples, which is often more reliable than describing the task in prose.",
        },
      ],
    },
  ];

  for (const m of modulesData) {
    const mod = await prisma.module.upsert({
      where: { courseId_slug: { courseId: course.id, slug: m.slug } },
      update: { title: m.title, description: m.description, order: m.order },
      create: {
        courseId: course.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        order: m.order,
      },
    });
    for (const l of m.lessons) {
      await prisma.lesson.upsert({
        where: { moduleId_slug: { moduleId: mod.id, slug: l.slug } },
        update: { title: l.title, content: l.content, order: l.order },
        create: {
          moduleId: mod.id,
          slug: l.slug,
          title: l.title,
          content: l.content,
          order: l.order,
        },
      });
    }
  }

  // Skills
  const skills = [
    {
      slug: "summarize-long-docs",
      title: "Summarize long documents",
      description: "Condense reports, papers, and transcripts without losing key points.",
      content:
        "Paste your document and ask for a layered summary: a one-line TL;DR, 3 key takeaways, and a bulleted detail list. Ask the model to flag anything uncertain.",
      accessRole: "USER",
    },
    {
      slug: "code-review-assistant",
      title: "Code review assistant",
      description: "Get a second pair of eyes on a diff.",
      content:
        "Provide the diff and the surrounding context. Ask for correctness issues, edge cases, naming, and security concerns, ranked by severity.",
      accessRole: "EDITOR",
    },
  ];
  for (const s of skills) {
    const rec = await prisma.skill.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    await assign(s.slug === "code-review-assistant" ? "Coding" : "Productivity", "skill", rec.id);
  }

  // Prompts
  const prompts = [
    {
      slug: "blog-post-outline",
      title: "Blog post outline",
      description: "Turn a topic into a structured outline.",
      body:
        "You are an expert content strategist. Create a detailed blog post outline about: {{topic}}. Include an SEO-friendly title, 5-7 H2 sections each with 2-3 bullet sub-points, and a short conclusion with a call to action.",
      accessRole: "USER",
    },
    {
      slug: "explain-like-im-five",
      title: "Explain like I'm five",
      description: "Simplify any concept.",
      body:
        "Explain the following concept as if to a curious five-year-old, using a simple everyday analogy, then give a one-sentence 'grown-up' version: {{concept}}",
      accessRole: "USER",
    },
    {
      slug: "sql-from-plain-english",
      title: "SQL from plain English",
      description: "Generate a query from a description.",
      body:
        "Given this schema: {{schema}}. Write a single SQL query that answers: {{question}}. Explain each clause briefly.",
      accessRole: "USER",
    },
  ];
  for (const p of prompts) {
    const rec = await prisma.prompt.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
    await assign(p.slug === "sql-from-plain-english" ? "Coding" : "Writing", "prompt", rec.id);
  }

  // Agents
  const agents = [
    {
      slug: "research-analyst",
      title: "Research Analyst",
      description: "An agent that gathers, synthesizes, and cites sources.",
      content:
        "System role for a research agent: define the question, search broadly, extract claims with citations, cross-check conflicting sources, and produce a briefing with confidence levels.",
      accessRole: "USER",
    },
    {
      slug: "release-notes-writer",
      title: "Release Notes Writer",
      description: "Transforms merged PRs into friendly release notes.",
      content:
        "Given a list of merged pull requests, group them into Features, Improvements, and Fixes. Write user-facing notes in plain language. Keep each entry to one sentence.",
      accessRole: "EDITOR",
    },
  ];
  for (const a of agents) {
    const rec = await prisma.agent.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
    await assign("Research", "agent", rec.id);
  }

  // A few starter links in the member's URL library
  const member = await prisma.user.findUnique({
    where: { email: "member@akc.dev" },
  });
  if (member) {
    const existing = await prisma.link.count({ where: { userId: member.id } });
    if (existing === 0) {
      await prisma.link.create({
        data: {
          userId: member.id,
          url: "https://platform.openai.com/docs",
          title: "OpenAI Platform Docs",
          description: "Official API and model documentation.",
          tags: { create: [{ name: "Research" }, { name: "Coding" }] },
        },
      });
      await prisma.link.create({
        data: {
          userId: member.id,
          url: "https://www.anthropic.com/news",
          title: "Anthropic News",
          description: "Updates and research from Anthropic.",
          tags: { create: [{ name: "Research" }] },
        },
      });
    }
  }

  console.log("Seed complete: users, tags, course/modules/lessons, skills, prompts, agents, links.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
