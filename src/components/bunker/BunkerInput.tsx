import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface BunkerInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const BunkerInput = forwardRef<HTMLInputElement, BunkerInputProps>(
  ({ className, label, icon, trailing, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "group relative flex items-center gap-2 border border-border/60 bg-background/60 px-3",
            "transition-all duration-200",
            "focus-within:border-neon/70 focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--neon)_35%,transparent),0_0_18px_-4px_color-mix(in_oklab,var(--neon)_45%,transparent)]",
          )}
        >
          {icon && <span className="text-muted-foreground group-focus-within:text-neon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full flex-1 bg-transparent font-mono text-sm tracking-wider text-foreground",
              "placeholder:text-muted-foreground/50 focus:outline-none",
              className,
            )}
            {...props}
          />
          {trailing}
        </div>
      </div>
    );
  },
);
BunkerInput.displayName = "BunkerInput";
