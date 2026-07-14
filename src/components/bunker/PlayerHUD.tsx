import { useEffect, useState } from "react";
import { Shield, Zap, Coins, Star, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { getPlayerStats } from "@/lib/bunker-supabase";
import { getPlayerProfile } from "@/lib/player";
import { levelProgress } from "@/lib/progression";
import { getRankSettings } from "@/lib/sheets.functions";
import { RankBadge } from "@/components/bunker/RankBadge";



interface PlayerHUDProps {
  onClick?: () => void;
  className?: string;
}

export function PlayerHUD({ onClick, className }: PlayerHUDProps) {
  const [time, setTime] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const t = setInterval(() => setTime(formatTime(new Date())), 15_000);
    return () => clearInterval(t);
  }, []);

  const statsQ = useQuery({
    queryKey: ["player_stats"],
    queryFn: getPlayerStats,
    refetchOnWindowFocus: true,
    refetchInterval: 8000,
  });
  const stats = statsQ.data;
  const profile = getPlayerProfile();

  const fetchRanks = useServerFn(getRankSettings);
  const ranksQ = useQuery({ queryKey: ["sheet_ranks"], queryFn: fetchRanks, staleTime: 60_000 });
  const xp = stats?.xp ?? 0;
  const currentRank = (ranksQ.data ?? []).find((r) => xp >= r.minXp && xp <= r.maxXp);

  const player = {
    name: profile.playerName ?? "OPERATOR",
    rank: (currentRank?.name ?? stats?.current_rank ?? "ROOKIE").toUpperCase(),
    badge: currentRank?.badgeImage ?? "",
    level: stats?.level ?? 1,
    xp: stats ? levelProgress(stats.xp) : 0,
    activity: stats?.activity ?? 0,
    gold: stats?.gold ?? 0,
    stars: Math.min(5, Math.floor((stats?.level ?? 1) / 4)),
    status: "ONLINE" as const,
  };


  const goldDisplay = useCountUp(player.gold);

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
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
        <span className="absolute -inset-y-4 left-0 w-1/3 bg-gradient-to-r from-transparent via-neon/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-btn-sweep" />
      </span>

      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
        <RankBadge
          name={player.rank}
          badgeImage={player.badge || null}
          accent={currentRank?.accent ?? null}
          level={player.level}
          size="md"
        />
      </div>


      <div className="flex min-w-0 flex-col justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground">
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

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <Shield className="h-3 w-3 text-neon" />
          <span className="text-foreground/80">{player.rank}</span>
          <span className="text-border">·</span>
          <Zap className="h-3 w-3 text-neon" />
          <span className="text-foreground/80">LV {player.level}</span>
        </div>

        <MiniBar label="XP" value={player.xp} tone="neon" />
        <MiniBar label="ACT" value={player.activity} tone="dim" />

        <div className="flex items-center gap-3 pt-0.5">
          <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-foreground">
            <Coins className="h-3 w-3 text-neon" />
            <span className="tabular-nums transition-all">{goldDisplay.toLocaleString()}</span>
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

function MiniBar({ label, value, tone }: { label: string; value: number; tone: "neon" | "dim" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-sm bg-panel-elevated/80 ring-1 ring-inset ring-black/40">
        <div
          className={cn(
            "h-full transition-[width] duration-1000 ease-out",
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

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const start = value;
    const delta = target - start;
    if (delta === 0) return;
    const startAt = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(start + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
