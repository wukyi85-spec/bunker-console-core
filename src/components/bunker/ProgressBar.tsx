import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  className?: string;
  tone?: "neon" | "muted";
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  className,
  tone = "neon",
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono text-foreground">{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-panel-elevated">
        <div
          className={cn(
            "h-full transition-[width] duration-500 ease-out",
            tone === "neon" ? "bg-neon" : "bg-muted-foreground",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
