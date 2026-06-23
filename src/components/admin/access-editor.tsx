"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Lock, Globe } from "lucide-react";
import { cn } from "@/components/ui";
import {
  setAccessMode,
  setUserSection,
  setGrant,
  setModuleLessons,
} from "@/lib/actions/admin";

const SECTIONS: { key: string; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "courses", label: "Courses" },
  { key: "skills", label: "Skills" },
  { key: "prompts", label: "Prompts" },
  { key: "agents", label: "Agents" },
  { key: "library", label: "URL Library" },
  { key: "favorites", label: "Favorites" },
  { key: "notes", label: "Notes" },
];

type Lesson = { id: string; title: string };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; title: string; modules: Module[] };
type Item = { id: string; title: string };

export function AccessEditor({
  userId,
  userName,
  initialMode,
  sections,
  grantedLessons,
  grantedSkills,
  grantedPrompts,
  grantedAgents,
  courses,
  skills,
  prompts,
  agents,
}: {
  userId: string;
  userName: string;
  initialMode: string;
  sections: string[];
  grantedLessons: string[];
  grantedSkills: string[];
  grantedPrompts: string[];
  grantedAgents: string[];
  courses: Course[];
  skills: Item[];
  prompts: Item[];
  agents: Item[];
}) {
  const [mode, setMode] = useState(initialMode);
  const [secSet, setSecSet] = useState(new Set(sections));
  const [lessons, setLessons] = useState(new Set(grantedLessons));
  const [skillSet, setSkillSet] = useState(new Set(grantedSkills));
  const [promptSet, setPromptSet] = useState(new Set(grantedPrompts));
  const [agentSet, setAgentSet] = useState(new Set(grantedAgents));
  const [, startTransition] = useTransition();

  function toggleMode(next: string) {
    setMode(next);
    startTransition(() => void setAccessMode(userId, next));
  }

  function toggleSection(key: string) {
    const next = new Set(secSet);
    const on = next.has(key);
    if (on) next.delete(key);
    else next.add(key);
    setSecSet(next);
    startTransition(() => void setUserSection(userId, key, !on));
  }

  function toggleItem(
    set: Set<string>,
    setter: (s: Set<string>) => void,
    type: string,
    id: string,
  ) {
    const next = new Set(set);
    const on = next.has(id);
    if (on) next.delete(id);
    else next.add(id);
    setter(next);
    startTransition(() => void setGrant(userId, type, id, !on));
  }

  function toggleLesson(id: string) {
    toggleItem(lessons, setLessons, "lesson", id);
  }

  function toggleModule(mod: Module, granted: boolean) {
    const next = new Set(lessons);
    for (const l of mod.lessons) {
      if (granted) next.add(l.id);
      else next.delete(l.id);
    }
    setLessons(next);
    startTransition(() => void setModuleLessons(userId, mod.id, granted));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Mode */}
      <div className="glass glow rounded-2xl p-5">
        <h2 className="mb-3 font-semibold">Access mode for {userName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => toggleMode("all")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ring-focus transition",
              mode === "all" ? "bg-primary text-primary-foreground halo-btn" : "glass-2 text-muted hover:text-foreground",
            )}
          >
            <Globe className="h-4 w-4" /> Full access (role-based)
          </button>
          <button
            onClick={() => toggleMode("custom")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ring-focus transition",
              mode === "custom" ? "bg-primary text-primary-foreground halo-btn" : "glass-2 text-muted hover:text-foreground",
            )}
          >
            <Lock className="h-4 w-4" /> Custom (choose exactly)
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">
          {mode === "all"
            ? "This user sees everything their role allows."
            : "This user only sees the sections and items you enable below."}
        </p>
      </div>

      {mode === "custom" && (
        <>
          <div className="glass glow rounded-2xl p-5">
            <h2 className="mb-3 font-semibold">Sections</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SECTIONS.map((s) => (
                <label
                  key={s.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ring-focus transition",
                    secSet.has(s.key) ? "bg-primary/15 text-primary" : "glass-2 text-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={secSet.has(s.key)}
                    onChange={() => toggleSection(s.key)}
                    className="accent-[var(--primary)]"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <GrantSection title="Courses & lessons" hint="Grant whole modules or individual lessons.">
            {courses.length === 0 ? (
              <p className="text-sm text-muted">No courses yet.</p>
            ) : (
              courses.map((c) => (
                <CourseGrant
                  key={c.id}
                  course={c}
                  lessons={lessons}
                  onToggleLesson={toggleLesson}
                  onToggleModule={toggleModule}
                />
              ))
            )}
          </GrantSection>

          <ItemGrant title="Skills" items={skills} set={skillSet} onToggle={(id) => toggleItem(skillSet, setSkillSet, "skill", id)} />
          <ItemGrant title="Prompts" items={prompts} set={promptSet} onToggle={(id) => toggleItem(promptSet, setPromptSet, "prompt", id)} />
          <ItemGrant title="Agents" items={agents} set={agentSet} onToggle={(id) => toggleItem(agentSet, setAgentSet, "agent", id)} />
        </>
      )}
    </div>
  );
}

function GrantSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass glow rounded-2xl p-5">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mb-3 text-sm text-muted">{hint}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function CourseGrant({
  course,
  lessons,
  onToggleLesson,
  onToggleModule,
}: {
  course: Course;
  lessons: Set<string>;
  onToggleLesson: (id: string) => void;
  onToggleModule: (mod: Module, granted: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const granted = course.modules.reduce(
    (n, m) => n + m.lessons.filter((l) => lessons.has(l.id)).length,
    0,
  );
  return (
    <div className="rounded-xl glass-2 p-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-left">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-medium">{course.title}</span>
        <span className="ml-auto text-xs text-muted">{granted}/{total} lessons</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3 pl-5">
          {course.modules.map((m) => {
            const all = m.lessons.length > 0 && m.lessons.every((l) => lessons.has(l.id));
            return (
              <div key={m.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={all}
                    onChange={() => onToggleModule(m, !all)}
                    className="accent-[var(--primary)]"
                  />
                  {m.title}
                  <span className="text-xs font-normal text-muted">(all)</span>
                </label>
                <div className="mt-1 flex flex-col gap-1 pl-6">
                  {m.lessons.map((l) => (
                    <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85">
                      <input
                        type="checkbox"
                        checked={lessons.has(l.id)}
                        onChange={() => onToggleLesson(l.id)}
                        className="accent-[var(--primary)]"
                      />
                      {l.title}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemGrant({
  title,
  items,
  set,
  onToggle,
}: {
  title: string;
  items: Item[];
  set: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <GrantSection title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((it) => (
            <label
              key={it.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ring-focus transition",
                set.has(it.id) ? "bg-primary/15 text-primary" : "glass-2 text-muted",
              )}
            >
              <input
                type="checkbox"
                checked={set.has(it.id)}
                onChange={() => onToggle(it.id)}
                className="accent-[var(--primary)]"
              />
              {it.title}
            </label>
          ))}
        </div>
      )}
    </GrantSection>
  );
}
