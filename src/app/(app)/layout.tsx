import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { path: true },
  });

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role }}
      favoritePaths={favorites.map((f) => f.path)}
    >
      {children}
    </AppShell>
  );
}
