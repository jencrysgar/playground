import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { allowedSections } from "@/lib/access";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [favorites, sections] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: user.id },
      select: { path: true },
    }),
    allowedSections(user),
  ]);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role }}
      favoritePaths={favorites.map((f) => f.path)}
      sections={sections}
    >
      {children}
    </AppShell>
  );
}
