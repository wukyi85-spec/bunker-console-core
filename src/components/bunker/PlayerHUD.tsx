import { useEffect, useState } from "react";
import { Shield, Zap, Coins, Star, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerHUDProps {
  onClick?: () => void;
  className?: string;
}

/**
 * Premium top-right game HUD.
 * Layered glass panel with portrait, rank, level, XP, activity, gold, stars,
 * clock and online status. Clickable — wire to Player Room later.
 */
export function PlayerHUD({ onClick, className }: PlayerHUDProps) {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const t = setInterval(() => setTime(formatTime(new Date())), 15_000);
    return () => clearInterval(t);
  }, []);

  // Placeholder values — swap with Supabase member row later.
  const player = {
    name: "BLACK",
    rank: "OPERATIVE",
    level: 18,
    xp: 72,
    activity: 88,
    gold: 2450,
    stars: 4,
    status: "ONLINE" as const,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: 360 }}
      className={cn(
        "group relative flex items-stretch gap-3 rounded-md p-3 pr-4",
        "gunmetal-glass text-left transition-all duration-300",
        "hover:border-neon/60 hover:shadow-[0_22px_60px_-16px_color-mix(in_oklab,var(--neon)_55%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60",
        className,
      )}
      aria-label="Open Player Room"
    >
      {/* Soft top glass highlight */}
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Sweep highlight on hover */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
        <span className="absolute -inset-y-4 left-0 w-1/3 bg-gradient-to-r from-transparent via-neon/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-btn-sweep" />
      </span>

      {/* Portrait */}
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-neon/40 bg-panel-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--neon)_25%,transparent),transparent_70%)]" />
        <svg viewBox="0 0 64 64" className="relative h-full w-full">
          <defs>
            <linearGradient id="hud-p" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--neon)" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="24" r="10" fill="url(#hud-p)" />
          <path d="M12 60 C 14 44, 50 44, 52 60 Z" fill="url(#hud-p)" />
        </svg>
        {/* Rank badge */}
        <span className="absolute -bottom-1 -right-1 rounded-sm border border-background bg-neon px-1 py-[1px] font-mono text-[9px] font-bold text-background shadow-[0_0_8px_-1px_var(--neon)]">
          {String(player.level).padStart(2, "0")}
        </span>
        {/* Corner tick */}
        <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-neon" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-r border-b border-neon" />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-col justify-between gap-1.5">
        {/* Row 1 — name / status */}
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-black uppercase tracking-[0.18em] text-foreground">
            {player.name}
          </span>
          <span className="flex items-center gap-1 rounded-sm border border-neon/40 bg-neon/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest text-neon">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse shadow-[0_0_6px_var(--neon)]" />
            {player.status}
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
            {time}
          </span>
        </div>

        {/* Row 2 — rank / level */}
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <Shield className="h-3 w-3 text-neon" />
          <span className="text-foreground/80">{player.rank}</span>
          <span className="text-border">·</span>
          <Zap className="h-3 w-3 text-neon" />
          <span className="text-foreground/80">LV {player.level}</span>
        </div>

        {/* Row 3 — XP */}
        <MiniBar label="XP" value={player.xp} tone="neon" />
        {/* Row 4 — Activity */}
        <MiniBar label="ACT" value={player.activity} tone="dim" />

        {/* Row 5 — gold / stars */}
        <div className="flex items-center gap-3 pt-0.5">
          <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-foreground">
            <Coins className="h-3 w-3 text-neon" />
            {player.gold.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < player.stars
                    ? "fill-neon text-neon drop-shadow-[0_0_4px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                    : "text-border",
                )}
              />
            ))}
          </span>
          <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            <Radio className="h-3 w-3 text-neon animate-hud-pulse" />
            SECURE
          </span>
        </div>
      </div>
    </button>
  );
}

function MiniBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neon" | "dim";
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-sm bg-panel-elevated/80 ring-1 ring-inset ring-black/40">
        <div
          className={cn(
            "h-full transition-[width] duration-700 ease-out",
            tone === "neon"
              ? "bg-gradient-to-r from-neon-dim via-neon to-neon shadow-[0_0_8px_-1px_var(--neon)]"
              : "bg-gradient-to-r from-muted-foreground/40 via-muted-foreground/70 to-neon-dim",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[9px] tabular-nums text-foreground/80">
        {pct}%
      </span>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
