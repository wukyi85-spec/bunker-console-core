import { useEffect, useState } from "react";
import { Zap, Coins, Star, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { getPlayerStats } from "@/lib/bunker-supabase";
import { getPlayerProfile, CHARACTERS } from "@/lib/player";
import { levelProgress } from "@/lib/progression";
import { getRankSettings } from "@/lib/sheets.functions";
import { BadgeGlow, getRankTheme } from "@/components/bunker/BadgeGlow";
import { CharacterPortrait } from "@/components/bunker/CharacterPortrait";



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
      className={cn(
        "group relative flex w-full max-w-full items-stretch gap-3 rounded-md p-3 pr-4 max-sm:gap-2 max-sm:p-2 max-sm:pr-2.5 sm:w-[360px]",
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

      {/* CHARACTER AVATAR (circle) — never the rank badge */}
      {(() => {
        const character =
          CHARACTERS.find((c) => c.id === profile.characterId) ?? CHARACTERS[0];
        return (
          <>
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/15 bg-panel-elevated shadow-[inset_0_0_18px_rgba(0,0,0,0.6),0_0_18px_-6px_var(--neon)] max-sm:hidden">
              <CharacterPortrait
                codename={character.codename}
                accent={character.accent}
                selected
                className="!aspect-auto h-full w-full"
              />
              <span
                className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-neon/25"
              />
            </div>
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/15 bg-panel-elevated shadow-[inset_0_0_14px_rgba(0,0,0,0.6)] sm:hidden">
              <CharacterPortrait
                codename={character.codename}
                accent={character.accent}
                selected
                className="!aspect-auto h-full w-full"
              />
            </div>
          </>
        );
      })()}


      <div className="flex min-w-0 flex-col justify-between gap-1.5 max-sm:gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground max-sm:text-xs">
            {player.name}
          </span>
          <span className="flex items-center gap-1 rounded-sm border border-neon/40 bg-neon/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest text-neon max-sm:px-1 max-sm:text-[7px]">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse shadow-[0_0_6px_var(--neon)] max-sm:h-1 max-sm:w-1" />
            {player.status}
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground max-sm:text-[8px]">
            {time}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground max-sm:text-[8px]">
          <span className="text-foreground/80">{player.rank}</span>
          {(() => {
            const t = getRankTheme(player.rank);
            return (
              <BadgeGlow
                src={player.badge || null}
                alt={player.rank}
                size={22}
                primary={currentRank?.accent || t.primary}
                secondary={t.secondary}
                intensity="sm"
                className="max-sm:!h-4 max-sm:!w-4"
              />
            );
          })()}
          <span className="text-border">·</span>
          <Zap className="h-3 w-3 text-white/70 max-sm:h-2.5 max-sm:w-2.5" />
          <span className="text-foreground/80">LV {player.level}</span>
        </div>

        <MiniBar label="XP" value={player.xp} tone="xp" />
        <MiniBar label="ACT" value={player.activity} tone="act" />

        <div className="flex items-center gap-3 pt-0.5 max-sm:gap-2">
          <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums max-sm:text-[8px]" style={{ color: "#F5C24B" }}>
            <Coins className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5" style={{ color: "#F5C24B" }} />
            <span className="tabular-nums transition-all">{goldDisplay.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5"
                style={
                  i < player.stars
                    ? { color: "#F5C24B", fill: "#F5C24B", filter: "drop-shadow(0 0 4px rgba(245,194,75,0.55))" }
                    : { color: "rgba(255,255,255,0.16)" }
                }
              />
            ))}
          </span>
          <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground max-sm:text-[7px]">
            <Radio className="h-3 w-3 text-neon animate-hud-pulse max-sm:h-2.5 max-sm:w-2.5" />
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
    <div className="flex items-center gap-2 max-sm:gap-1.5">
      <span className="w-6 font-mono text-[9px] uppercase tracking-widest text-muted-foreground max-sm:w-5 max-sm:text-[7px]">
        {label}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-sm bg-panel-elevated/80 ring-1 ring-inset ring-black/40 max-sm:h-0.5">
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
      <span className="w-8 text-right font-mono text-[9px] tabular-nums text-foreground/80 max-sm:w-6 max-sm:text-[7px]">
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
