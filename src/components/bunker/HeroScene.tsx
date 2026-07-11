export function HeroScene() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border/60 bg-panel">
      {/* HUD grid backdrop */}
      <div className="absolute inset-0 hud-grid opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_85%)]" />

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent" />

      {/* Corner markers */}
      <CornerMark className="top-3 left-3" />
      <CornerMark className="top-3 right-3 rotate-90" />
      <CornerMark className="bottom-3 left-3 -rotate-90" />
      <CornerMark className="bottom-3 right-3 rotate-180" />

      {/* Center - reserved for future animated character */}
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon animate-hud-pulse">
            // BUNKER ONLINE
          </span>
          <h1 className="font-display text-4xl font-black uppercase tracking-[0.15em] text-foreground sm:text-5xl">
            Welcome, Operator
          </h1>
          <p className="max-w-md text-xs uppercase tracking-widest text-muted-foreground">
            Members-only. Off the grid. Off the record.
          </p>
        </div>
      </div>

      {/* Bottom telemetry strip */}
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>GRID · 47.812 N · 122.335 W</span>
        <span className="text-neon">SYS · SECURE</span>
        <span>03:41:22 UTC</span>
      </div>
    </div>
  );
}

function CornerMark({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute h-4 w-4 border-l-2 border-t-2 border-neon/70 ${className}`} />
  );
}
