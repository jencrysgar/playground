import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "EDITOR")) redirect("/dashboard");
  const isAdmin = hasRole(user.role, "ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <AdminNav isAdmin={isAdmin} />
      {children}
    </div>
  );
}
