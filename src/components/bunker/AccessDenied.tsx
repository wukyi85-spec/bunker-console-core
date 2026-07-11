import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export function AccessDenied({
  message = "Invalid Stoner Pass ID or Password.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 border border-destructive/50 border-l-2 bg-destructive/10 px-3 py-2",
        "animate-in fade-in slide-in-from-top-1 duration-300",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-destructive">
          Access Denied
        </span>
        <span className="text-xs text-foreground/80">{message}</span>
      </div>
    </div>
  );
}
