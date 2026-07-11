import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "hud";
  bordered?: boolean;
  corners?: boolean;
  children?: ReactNode;
}

export function Panel({
  className,
  variant = "default",
  bordered = true,
  corners = false,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        "relative rounded-md",
        variant === "default" && "bg-panel",
        variant === "elevated" && "bg-panel-elevated",
        variant === "hud" && "bg-hud",
        bordered && "border border-border/60",
        corners && "corner-frame corner-frame-lines",
        "shadow-[var(--shadow-panel)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
