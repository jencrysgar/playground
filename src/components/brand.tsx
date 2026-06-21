import { Sparkles } from "lucide-react";
import { cn } from "@/components/ui";

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-blue-500 text-white halo-btn">
        <Sparkles className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-lg font-semibold tracking-tight">
          AI Knowledge <span className="text-gradient">Center</span>
        </span>
      )}
    </span>
  );
}
