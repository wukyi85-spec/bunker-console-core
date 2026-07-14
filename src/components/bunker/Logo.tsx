import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("group flex items-center gap-3 select-none", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Ambient glow */}
        <span className="pointer-events-none absolute -inset-2 rounded-full bg-neon/25 opacity-70 blur-xl" />
        {/* Rotating conic outer ring */}
        <span
          className="pointer-events-none absolute inset-0 rounded-sm animate-badge-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, var(--neon) 90deg, transparent 180deg, color-mix(in oklab, var(--neon) 60%, transparent) 270deg, transparent 360deg)",
            WebkitMask:
              "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
        {/* Body */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm border border-neon/70 bg-background shadow-[0_0_22px_-4px_var(--neon),inset_0_0_18px_-6px_var(--neon)]">
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--neon)_35%,transparent),transparent_70%)]" />
          {/* Diagonal shine sweep */}
          <span className="pointer-events-none absolute -inset-4 -translate-x-full bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.35)_50%,transparent_65%)] group-hover:animate-btn-sweep" />
          <span
            className="relative font-display text-2xl font-black leading-none text-neon"
            style={{ textShadow: "0 0 12px var(--neon), 0 0 22px color-mix(in oklab, var(--neon) 60%, transparent)" }}
          >
            B
          </span>
          {/* Corner ticks */}
          <span className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-neon/80" />
          <span className="absolute right-0 top-0 h-1.5 w-1.5 border-r border-t border-neon/80" />
          <span className="absolute left-0 bottom-0 h-1.5 w-1.5 border-l border-b border-neon/80" />
          <span className="absolute right-0 bottom-0 h-1.5 w-1.5 border-r border-b border-neon/80" />
        </div>
        {/* Status dot */}
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-neon animate-hud-pulse shadow-[0_0_10px_var(--neon)]" />
      </div>
      <div className="flex flex-col leading-none gap-1">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.5em] text-neon/70">
          // Members
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[11px] font-medium uppercase tracking-[0.4em] text-muted-foreground">
            Black&rsquo;s
          </span>
          <span
            className="font-display text-2xl font-black uppercase tracking-[0.18em] text-foreground"
            style={{ textShadow: "0 0 18px color-mix(in oklab, var(--neon) 25%, transparent)" }}
          >
            Bunker
          </span>
        </div>
      </div>
    </div>
  );
}
