"use client";

import { useActionState } from "react";
import { Button, Input, Textarea, Label } from "@/components/ui";
import {
  saveCourse,
  saveSkill,
  savePrompt,
  saveAgent,
  saveModule,
  saveLesson,
  type SaveState,
} from "@/lib/actions/content-admin";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {children}
    </div>
  );
}

function ErrorText({ state }: { state: SaveState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
      {state.error}
    </p>
  );
}

function AccessRole({ value }: { value?: string }) {
  return (
    <Field label="Who can access this?" hint="Members see Member content; Editors and Admins see everything up to their level.">
      <select
        name="accessRole"
        defaultValue={value ?? "USER"}
        className="w-full rounded-xl glass-2 px-3.5 py-2.5 text-sm ring-focus"
      >
        <option value="USER">All members</option>
        <option value="EDITOR">Editors & admins</option>
        <option value="ADMIN">Admins only</option>
      </select>
    </Field>
  );
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

type CourseInit = {
  id?: string;
  title?: string;
  description?: string;
  length?: string;
  level?: string;
  outcomes?: string;
  prerequisites?: string;
  accessRole?: string;
};

export function CourseForm({ init }: { init?: CourseInit }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveCourse, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {init?.id && <input type="hidden" name="id" value={init.id} />}
      <Field label="Title">
        <Input name="title" defaultValue={init?.title} required />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={init?.description} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Length" hint="e.g. 2 hours · 3 lessons">
          <Input name="length" defaultValue={init?.length} />
        </Field>
        <Field label="Level">
          <select name="level" defaultValue={init?.level ?? "Beginner"} className="w-full rounded-xl glass-2 px-3.5 py-2.5 text-sm ring-focus">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </Field>
      </div>
      <Field label="What you'll learn" hint="One outcome per line.">
        <Textarea name="outcomes" rows={4} defaultValue={init?.outcomes} />
      </Field>
      <Field label="Prerequisites">
        <Textarea name="prerequisites" rows={2} defaultValue={init?.prerequisites} />
      </Field>
      <AccessRole value={init?.accessRole} />
      <ErrorText state={state} />
      <Submit pending={pending} label={init?.id ? "Save course" : "Create course"} />
    </form>
  );
}

type SkillInit = {
  id?: string;
  title?: string;
  description?: string;
  problem?: string;
  whatYouGet?: string;
  howItWorks?: string;
  howToTrigger?: string;
  worksWith?: string;
  corePrompt?: string;
  promptNotes?: string;
  accessRole?: string;
};

export function SkillForm({ init }: { init?: SkillInit }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveSkill, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {init?.id && <input type="hidden" name="id" value={init.id} />}
      <Field label="Title">
        <Input name="title" defaultValue={init?.title} required />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={init?.description} />
      </Field>
      <Field label="The problem">
        <Textarea name="problem" rows={2} defaultValue={init?.problem} />
      </Field>
      <Field label="What you get">
        <Textarea name="whatYouGet" rows={2} defaultValue={init?.whatYouGet} />
      </Field>
      <Field label="How it works">
        <Textarea name="howItWorks" rows={2} defaultValue={init?.howItWorks} />
      </Field>
      <Field label="How to trigger it">
        <Textarea name="howToTrigger" rows={2} defaultValue={init?.howToTrigger} />
      </Field>
      <Field label="Works with" hint="Comma-separated, e.g. ChatGPT, Claude, Gemini">
        <Input name="worksWith" defaultValue={init?.worksWith} />
      </Field>
      <Field label="Core prompt" hint="The copy/paste prompt members will use.">
        <Textarea name="corePrompt" rows={6} defaultValue={init?.corePrompt} className="font-mono" />
      </Field>
      <Field label="Prompt notes" hint="Anything the user should change/customize.">
        <Textarea name="promptNotes" rows={3} defaultValue={init?.promptNotes} />
      </Field>
      <AccessRole value={init?.accessRole} />
      <ErrorText state={state} />
      <Submit pending={pending} label={init?.id ? "Save skill" : "Create skill"} />
    </form>
  );
}

type PromptInit = {
  id?: string;
  title?: string;
  description?: string;
  howToUse?: string;
  body?: string;
  extraTitle?: string;
  extraContent?: string;
  accessRole?: string;
};

export function PromptForm({ init }: { init?: PromptInit }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(savePrompt, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {init?.id && <input type="hidden" name="id" value={init.id} />}
      <Field label="Title">
        <Input name="title" defaultValue={init?.title} required />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={init?.description} />
      </Field>
      <Field label="How to use">
        <Textarea name="howToUse" rows={2} defaultValue={init?.howToUse} />
      </Field>
      <Field label="The prompt" hint="The copy/paste prompt.">
        <Textarea name="body" rows={6} defaultValue={init?.body} className="font-mono" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Extra section title" hint='Optional, e.g. "What you’ll get back"'>
          <Input name="extraTitle" defaultValue={init?.extraTitle} />
        </Field>
        <Field label="Extra section content">
          <Textarea name="extraContent" rows={2} defaultValue={init?.extraContent} />
        </Field>
      </div>
      <AccessRole value={init?.accessRole} />
      <ErrorText state={state} />
      <Submit pending={pending} label={init?.id ? "Save prompt" : "Create prompt"} />
    </form>
  );
}

type AgentInit = {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  platform?: string;
  accessRole?: string;
};

export function AgentForm({ init }: { init?: AgentInit }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveAgent, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {init?.id && <input type="hidden" name="id" value={init.id} />}
      <Field label="Title">
        <Input name="title" defaultValue={init?.title} required />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={init?.description} />
      </Field>
      <Field label="External link" hint="Link to the Custom GPT, Claude Project, etc.">
        <Input name="url" type="url" placeholder="https://…" defaultValue={init?.url} />
      </Field>
      <Field label="Platform" hint="e.g. ChatGPT, Claude">
        <Input name="platform" defaultValue={init?.platform} />
      </Field>
      <AccessRole value={init?.accessRole} />
      <ErrorText state={state} />
      <Submit pending={pending} label={init?.id ? "Save agent" : "Create agent"} />
    </form>
  );
}

// Module & lesson forms used inside the course editor (no redirect).

export function ModuleForm({
  courseId,
  init,
  onDone,
}: {
  courseId: string;
  init?: { id?: string; title?: string; description?: string; order?: number };
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    async (prev, fd) => {
      const res = await saveModule(prev, fd);
      if (!res?.error) onDone?.();
      return res;
    },
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      {init?.id && <input type="hidden" name="id" value={init.id} />}
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <Input name="title" placeholder="Module title" defaultValue={init?.title} required />
        <Input name="order" type="number" placeholder="Order" defaultValue={init?.order ?? 0} />
      </div>
      <Textarea name="description" rows={2} placeholder="Module description" defaultValue={init?.description} />
      <ErrorText state={state} />
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : init?.id ? "Save module" : "Add module"}
        </Button>
      </div>
    </form>
  );
}

export function LessonForm({
  moduleId,
  init,
  onDone,
}: {
  moduleId: string;
  init?: { id?: string; title?: string; content?: string; order?: number };
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    async (prev, fd) => {
      const res = await saveLesson(prev, fd);
      if (!res?.error) onDone?.();
      return res;
    },
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      {init?.id && <input type="hidden" name="id" value={init.id} />}
      <input type="hidden" name="moduleId" value={moduleId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <Input name="title" placeholder="Lesson title" defaultValue={init?.title} required />
        <Input name="order" type="number" placeholder="Order" defaultValue={init?.order ?? 0} />
      </div>
      <Textarea name="content" rows={4} placeholder="Lesson content" defaultValue={init?.content} />
      <ErrorText state={state} />
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : init?.id ? "Save lesson" : "Add lesson"}
        </Button>
      </div>
    </form>
  );
}
