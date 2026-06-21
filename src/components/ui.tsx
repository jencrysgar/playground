import * as React from "react";
import Link from "next/link";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium ring-focus transition disabled:cursor-not-allowed disabled:opacity-50 select-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground halo-btn hover:opacity-90 active:scale-[0.98]",
  secondary:
    "glass text-foreground hover:border-[var(--ring)] active:scale-[0.98]",
  ghost: "text-foreground hover:bg-foreground/5 active:scale-[0.98]",
  danger: "bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98]",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function Card({
  className,
  glow = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5",
        glow && "glow glow-hover",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl glass-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted ring-focus transition",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl glass-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted ring-focus transition",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

const tagColors: Record<string, string> = {
  purple: "bg-purple-500/15 text-purple-500 ring-purple-500/30",
  pink: "bg-pink-500/15 text-pink-500 ring-pink-500/30",
  blue: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
  emerald: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  rose: "bg-rose-500/15 text-rose-500 ring-rose-500/30",
  amber: "bg-amber-500/15 text-amber-600 ring-amber-500/30",
  cyan: "bg-cyan-500/15 text-cyan-500 ring-cyan-500/30",
};

export function TagPill({
  name,
  color = "purple",
  className,
}: {
  name: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        tagColors[color] ?? tagColors.purple,
        className,
      )}
    >
      {name}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary glow">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Renders multi-line plain text as paragraphs. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paras = text.split("\n").filter((p) => p.trim().length > 0);
  return (
    <div className={cn("text-[15px] leading-relaxed text-foreground/90", className)}>
      {paras.map((p, i) => (
        <p key={i} className="mb-3 last:mb-0">
          {p}
        </p>
      ))}
    </div>
  );
}

/** Renders multi-line text as a bulleted list (one item per line). */
export function BulletList({ text }: { text: string }) {
  const items = text.split("\n").map((t) => t.trim()).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-[15px] text-foreground/90">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {it}
        </li>
      ))}
    </ul>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass glow rounded-2xl p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass-2 flex flex-col items-center gap-2 rounded-2xl px-6 py-16 text-center">
      {icon && <div className="text-primary">{icon}</div>}
      <p className="text-base font-medium">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}
