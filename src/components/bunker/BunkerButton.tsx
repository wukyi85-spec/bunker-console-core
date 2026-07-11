import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface BunkerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const BunkerButton = forwardRef<HTMLButtonElement, BunkerButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-wider",
          "rounded-md transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60",
          "disabled:opacity-40 disabled:pointer-events-none",
          size === "sm" && "h-8 px-3 text-xs",
          size === "md" && "h-10 px-5 text-sm",
          size === "lg" && "h-12 px-7 text-base",
          variant === "primary" &&
            "bg-neon text-background hover:bg-neon-dim shadow-[0_4px_20px_-6px_color-mix(in_oklab,var(--neon)_50%,transparent)]",
          variant === "ghost" &&
            "bg-panel-elevated text-foreground hover:bg-panel-elevated/70 border border-border/60",
          variant === "outline" &&
            "bg-transparent text-neon border border-neon/50 hover:bg-neon/10",
          variant === "danger" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/85",
          className,
        )}
        {...props}
      />
    );
  },
);
BunkerButton.displayName = "BunkerButton";
