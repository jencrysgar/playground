import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.defaultLanding || "/dashboard");

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo />
        <p className="max-w-sm text-sm text-muted">
          Your personal hub for AI courses, skills, prompts, agents, and curated
          links.
        </p>
      </div>
      <div className="w-full max-w-md glass glow rounded-2xl p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
