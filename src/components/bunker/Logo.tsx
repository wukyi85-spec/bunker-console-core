import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-neon/60 bg-background">
        <span className="font-display text-lg font-black leading-none text-neon">B</span>
        <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          Black&rsquo;s
        </span>
        <span className="font-display text-lg font-black uppercase tracking-widest text-foreground">
          Bunker
        </span>
      </div>
    </div>
  );
}
