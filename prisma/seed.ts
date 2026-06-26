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
      update: {}, // non-destructive: don't overwrite admin edits on re-seed
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
      update: {},
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
  const courseData = {
    title: "Prompt Engineering Foundations",
    description:
      "Learn how to talk to large language models effectively, from first principles to advanced patterns.",
    length: "About 2 hours · 3 lessons",
    level: "Beginner",
    outcomes:
      "Understand how models interpret prompts\nWrite clear, structured prompts\nApply few-shot and chain-of-thought techniques\nIterate to reliably improve outputs",
    prerequisites: "None — just curiosity and access to an AI chat tool.",
    accessRole: "USER",
  };
  const course = await prisma.course.upsert({
    where: { slug: "prompt-engineering-foundations" },
    update: {},
    create: { slug: "prompt-engineering-foundations", ...courseData },
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
      update: {},
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
        update: {},
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
      problem:
        "Long documents take ages to read, and important details get buried. You need the gist fast without missing anything critical.",
      whatYouGet:
        "A layered summary: a one-line TL;DR, 3 key takeaways, and a bulleted detail list — plus flags on anything uncertain.",
      howItWorks:
        "The prompt asks the model to read for structure first, then compress in layers so you can drill from headline to detail.",
      howToTrigger:
        "Paste your document where indicated and send. Works best with documents under ~20 pages per message.",
      worksWith: "ChatGPT, Claude, Gemini",
      corePrompt:
        "Summarize the following document in three layers:\n1) A one-sentence TL;DR.\n2) The 3 most important takeaways.\n3) A bulleted list of supporting details.\nFlag anything that seems uncertain or contradictory.\n\nDOCUMENT:\n{{paste your document here}}",
      promptNotes:
        "Replace {{paste your document here}} with your text. For very long docs, split into parts and summarize each, then summarize the summaries.",
      accessRole: "USER",
    },
    {
      slug: "code-review-assistant",
      title: "Code review assistant",
      description: "Get a second pair of eyes on a diff.",
      problem:
        "Reviewing your own code is hard — you miss edge cases, security issues, and naming problems you're too close to see.",
      whatYouGet:
        "A prioritized review covering correctness, edge cases, naming, and security, ranked by severity with concrete suggestions.",
      howItWorks:
        "The prompt frames the model as a senior reviewer and asks for severity-ranked findings rather than vague feedback.",
      howToTrigger:
        "Paste your diff (and any relevant context) into the placeholder and send.",
      worksWith: "ChatGPT, Claude",
      corePrompt:
        "You are a senior software engineer doing a code review. Review the following diff and list issues ranked by severity (Critical, High, Medium, Low). For each, give the problem and a concrete fix. Cover correctness, edge cases, naming, and security.\n\nCONTEXT:\n{{what this code does}}\n\nDIFF:\n{{paste your diff here}}",
      promptNotes:
        "Fill in {{what this code does}} and {{paste your diff here}}. Add your language/framework for sharper feedback.",
      accessRole: "EDITOR",
    },
  ];
  for (const s of skills) {
    const rec = await prisma.skill.upsert({
      where: { slug: s.slug },
      update: {},
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
      howToUse:
        "Replace {{topic}} with your subject. Optionally tell the model your target audience and tone for a sharper outline.",
      body:
        "You are an expert content strategist. Create a detailed blog post outline about: {{topic}}. Include an SEO-friendly title, 5-7 H2 sections each with 2-3 bullet sub-points, and a short conclusion with a call to action.",
      extraTitle: "What you'll get back",
      extraContent:
        "A ready-to-write outline: one SEO title, 5-7 sections with sub-points, and a CTA-driven conclusion you can flesh out into a full post.",
      accessRole: "USER",
    },
    {
      slug: "explain-like-im-five",
      title: "Explain like I'm five",
      description: "Simplify any concept.",
      howToUse: "Replace {{concept}} with whatever you want explained simply.",
      body:
        "Explain the following concept as if to a curious five-year-old, using a simple everyday analogy, then give a one-sentence 'grown-up' version: {{concept}}",
      extraTitle: "What you'll get back",
      extraContent:
        "A friendly analogy a child could follow, plus a precise one-line definition for grown-ups.",
      accessRole: "USER",
    },
    {
      slug: "sql-from-plain-english",
      title: "SQL from plain English",
      description: "Generate a query from a description.",
      howToUse:
        "Paste your table schema into {{schema}} and your question into {{question}}.",
      body:
        "Given this schema: {{schema}}. Write a single SQL query that answers: {{question}}. Explain each clause briefly.",
      extraTitle: "",
      extraContent: "",
      accessRole: "USER",
    },
  ];
  for (const p of prompts) {
    const rec = await prisma.prompt.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    await assign(p.slug === "sql-from-plain-english" ? "Coding" : "Writing", "prompt", rec.id);
  }

  // Agents (external links to Custom GPTs / Claude Projects / etc.)
  const agents = [
    {
      slug: "research-analyst",
      title: "Research Analyst",
      description:
        "A Custom GPT that gathers, synthesizes, and cites sources into a confidence-rated briefing.",
      url: "https://chatgpt.com/gpts",
      platform: "ChatGPT",
      accessRole: "USER",
    },
    {
      slug: "release-notes-writer",
      title: "Release Notes Writer",
      description:
        "A Claude Project that turns merged pull requests into friendly, grouped release notes.",
      url: "https://claude.ai/projects",
      platform: "Claude",
      accessRole: "EDITOR",
    },
  ];
  for (const a of agents) {
    const rec = await prisma.agent.upsert({
      where: { slug: a.slug },
      update: {},
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
