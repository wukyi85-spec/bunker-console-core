import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "border-l-muted-foreground",
  success: "border-l-neon",
  warning: "border-l-yellow-500/70",
  danger: "border-l-destructive",
};

const labels: Record<Tone, string> = {
  info: "INTEL",
  success: "OPS",
  warning: "ALERT",
  danger: "THREAT",
};

export function NotificationCard({
  tone = "info",
  title,
  time,
  children,
  className,
}: {
  tone?: Tone;
  title: string;
  time?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border border-border/60 border-l-2 bg-panel px-3 py-2 shadow-[var(--shadow-panel)]",
        tones[tone],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "font-mono text-[9px] uppercase tracking-widest",
              tone === "success" && "text-neon",
              tone === "danger" && "text-destructive",
              tone === "warning" && "text-yellow-500",
              tone === "info" && "text-muted-foreground",
            )}
          >
            {labels[tone]}
          </span>
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-foreground">
            {title}
          </span>
        </div>
        {time && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{time}</span>}
      </div>
      {children && <p className="text-xs text-muted-foreground">{children}</p>}
    </div>
  );
}
