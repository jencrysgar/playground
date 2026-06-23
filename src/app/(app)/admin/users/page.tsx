import { redirect } from "next/navigation";
import { Users, SlidersHorizontal } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, LinkButton } from "@/components/ui";
import { UserEditor } from "@/components/admin/user-editor";

export default async function AdminUsersPage() {
  const me = (await getCurrentUser())!;
  if (!hasRole(me.role, "ADMIN")) redirect("/admin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Set each member's role. Editors can manage content & tags; admins can manage everything."
        icon={<Users className="h-5 w-5" />}
      />
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className="glass glow flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-sm font-semibold text-white">
                {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {u.name}
                  {u.id === me.id && <span className="ml-2 text-xs text-muted">(you)</span>}
                </p>
                <p className="text-sm text-muted">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {u.accessMode === "custom" && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Custom access
                </span>
              )}
              <UserEditor userId={u.id} name={u.name} role={u.role} isSelf={u.id === me.id} />
              <LinkButton href={`/admin/users/${u.id}/access`} variant="secondary" size="sm">
                <SlidersHorizontal className="h-4 w-4" /> Access
              </LinkButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
