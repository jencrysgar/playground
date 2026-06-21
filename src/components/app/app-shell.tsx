"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Wand2,
  Lightbulb,
  Bot,
  Library,
  Star,
  StickyNote,
  Search,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/components/ui";
import { FavoriteButton } from "@/components/app/favorite-button";
import { logoutAction } from "@/lib/actions/auth";
import { hasRole } from "@/lib/permissions";

type NavItem = { href: string; label: string; icon: React.ElementType };

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/skills", label: "Skills", icon: Wand2 },
  { href: "/prompts", label: "Prompts", icon: Lightbulb },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/library", label: "URL Library", icon: Library },
];

const personalNav: NavItem[] = [
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/search", label: "Search", icon: Search },
];

export function AppShell({
  user,
  favoritePaths,
  children,
}: {
  user: { name: string; email: string; role: string };
  favoritePaths: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isAdmin = hasRole(user.role, "EDITOR");
  const favSet = new Set(favoritePaths);
  const isFavorited = favSet.has(pathname);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  }

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border glass p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} onClick={() => setOpen(false)} />
          ))}
        </nav>

        <p className="mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted">
          Personal
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {personalNav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} onClick={() => setOpen(false)} />
          ))}
        </nav>

        {isAdmin && (
          <>
            <p className="mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted">
              Manage
            </p>
            <nav className="mt-2 flex flex-col gap-1">
              <NavLink
                item={{ href: "/admin", label: "Admin", icon: Shield }}
                active={pathname.startsWith("/admin")}
                onClick={() => setOpen(false)}
              />
            </nav>
          </>
        )}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border glass px-4 py-3">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <form onSubmit={submitSearch} className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everything…"
              className="w-full rounded-xl glass-2 py-2 pl-9 pr-3 text-sm ring-focus"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <FavoriteButton path={pathname} title={titleFromPath(pathname)} initialFavorited={isFavorited} />
            <ThemeToggle />
            <UserMenu user={user} onLogout={() => logoutAction()} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-primary/15 text-primary glow"
          : "text-muted hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function UserMenu({
  user,
  onLogout,
}: {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-sm font-semibold text-white ring-focus halo-btn"
        aria-label="Account menu"
      >
        {initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 glass glow rounded-2xl p-2">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                {user.role}
              </span>
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function titleFromPath(path: string): string {
  if (path === "/dashboard") return "Dashboard";
  const seg = path.split("/").filter(Boolean);
  if (seg.length === 0) return "Home";
  return seg[seg.length - 1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
