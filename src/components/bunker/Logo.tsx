import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center rounded-sm border border-neon/60 bg-background shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--neon)_50%,transparent)]">
        <span className="font-display text-2xl font-black leading-none text-neon">B</span>
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-neon animate-hud-pulse shadow-[0_0_8px_var(--neon)]" />
        <span className="absolute inset-0 rounded-sm border border-neon/20" />
      </div>
      <div className="flex flex-col leading-none gap-1">
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.4em] text-muted-foreground">
          Black&rsquo;s
        </span>
        <span className="font-display text-2xl font-black uppercase tracking-[0.18em] text-foreground">
          Bunker
        </span>
      </div>
    </div>
  );
}
