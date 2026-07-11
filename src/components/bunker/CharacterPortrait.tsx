import { cn } from "@/lib/utils";

interface CharacterPortraitProps {
  codename: string;
  accent: string;
  selected?: boolean;
  className?: string;
}

// Stylized SVG placeholder portrait — no external assets required.
export function CharacterPortrait({ codename, accent, selected, className }: CharacterPortraitProps) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-panel-elevated to-background",
        className,
      )}
    >
      {/* HUD grid backdrop */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-30" />

      {/* Silhouette */}
      <svg
        viewBox="0 0 120 160"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`g-${codename}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id={`glow-${codename}`} cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={selected ? 0.35 : 0.15} />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="120" height="160" fill={`url(#glow-${codename})`} />
        {/* Head */}
        <circle cx="60" cy="55" r="20" fill={`url(#g-${codename})`} opacity="0.85" />
        {/* Shoulders / torso */}
        <path
          d="M20 160 C 24 110, 45 88, 60 88 C 75 88, 96 110, 100 160 Z"
          fill={`url(#g-${codename})`}
          opacity="0.85"
        />
        {/* Visor */}
        <rect x="46" y="50" width="28" height="6" fill={accent} opacity="0.9" />
      </svg>

      {/* Scanline */}
      <div
        className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ top: "38%", opacity: 0.4 }}
      />

      {/* Codename tag */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.3em] text-foreground/80">
        <span>{codename}</span>
        <span className="text-neon">●</span>
      </div>
    </div>
  );
}
