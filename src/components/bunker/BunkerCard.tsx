import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";
import { Panel } from "./Panel";

interface BunkerCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  tag?: string;
  footer?: ReactNode;
  interactive?: boolean;
}

export function BunkerCard({
  title,
  tag,
  footer,
  interactive,
  className,
  children,
  ...props
}: BunkerCardProps) {
  return (
    <Panel
      variant="default"
      className={cn(
        "p-4 flex flex-col gap-3",
        interactive &&
          "cursor-pointer transition-all duration-200 hover:border-neon/40 hover:bg-panel-elevated",
        className,
      )}
      {...props}
    >
      {(title || tag) && (
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              {title}
            </h3>
          )}
          {tag && (
            <span className="rounded-sm border border-neon/40 bg-neon/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neon">
              {tag}
            </span>
          )}
        </div>
      )}
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
      {footer && <div className="mt-auto pt-2 border-t border-border/40">{footer}</div>}
    </Panel>
  );
}
