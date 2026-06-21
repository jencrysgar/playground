"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { ModuleForm, LessonForm } from "@/components/edit/forms";
import { deleteModule, deleteLesson } from "@/lib/actions/content-admin";

type Lesson = { id: string; title: string; content: string; order: number };
type Module = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
};

export function CourseModulesEditor({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Module[];
}) {
  const router = useRouter();
  const [addingModule, setAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-4">
      {modules.map((m) => (
        <div key={m.id} className="glass glow rounded-2xl p-5">
          {editingModule === m.id ? (
            <div className="flex flex-col gap-2">
              <ModuleForm
                courseId={courseId}
                init={m}
                onDone={() => {
                  setEditingModule(null);
                  refresh();
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => setEditingModule(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="text-sm text-muted">{m.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingModule(m.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteModule(m.id);
                      refresh();
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <ul className="flex flex-col gap-1">
            {m.lessons.map((l) =>
              editingLesson === l.id ? (
                <li key={l.id} className="rounded-xl glass-2 p-3">
                  <LessonForm
                    moduleId={m.id}
                    init={l}
                    onDone={() => {
                      setEditingLesson(null);
                      refresh();
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setEditingLesson(null)}>
                    Cancel
                  </Button>
                </li>
              ) : (
                <li key={l.id} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                  <span>{l.title}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingLesson(l.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteLesson(l.id);
                          refresh();
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>

          {addingLessonTo === m.id ? (
            <div className="mt-3 rounded-xl glass-2 p-3">
              <LessonForm
                moduleId={m.id}
                onDone={() => {
                  setAddingLessonTo(null);
                  refresh();
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => setAddingLessonTo(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAddingLessonTo(m.id)}>
              <Plus className="h-4 w-4" /> Add lesson
            </Button>
          )}
        </div>
      ))}

      {addingModule ? (
        <div className="glass glow rounded-2xl p-5">
          <ModuleForm
            courseId={courseId}
            onDone={() => {
              setAddingModule(false);
              refresh();
            }}
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAddingModule(false)}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setAddingModule(true)}>
          <Plus className="h-4 w-4" /> Add module
        </Button>
      )}
    </div>
  );
}
