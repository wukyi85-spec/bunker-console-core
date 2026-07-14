import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { getPlayerStats } from "@/lib/bunker-supabase";
import { getRankSettings } from "@/lib/sheets.functions";
import { BadgeGlow, getRankTheme } from "@/components/bunker/BadgeGlow";
import { Lock, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rank")({
  head: () => ({
    meta: [
      { title: "Rank — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RankPage,
});

function RankPage() {
  const fetchRanks = useServerFn(getRankSettings);
  const ranksQ = useQuery({ queryKey: ["sheet_ranks"], queryFn: fetchRanks, staleTime: 60_000 });
  const statsQ = useQuery({ queryKey: ["player_stats"], queryFn: getPlayerStats });

  const ranks = ranksQ.data ?? [];
  const stats = statsQ.data;
  const xp = stats?.xp ?? 0;
  const current = ranks.find((r) => xp >= r.minXp && xp <= r.maxXp);
  const next = ranks.find((r) => r.minXp > xp);
  const progress =
    next && current
      ? Math.min(100, ((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
      : 100;

  return (
    <AppShell hideLogo hideNav>
      <div className="flex h-full w-full flex-col gap-4 overflow-y-auto animate-in fade-in duration-500">
        {/* Header strip */}
        <Panel variant="elevated" corners className="corner-frame-lines flex items-center gap-4 p-4">
          <Trophy className="h-5 w-5 text-neon" />
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              // Rank Showcase
            </div>
            <div className="font-display text-xl font-black uppercase tracking-widest text-foreground">
              Operator Ladder
            </div>
          </div>
          <div className="min-w-[220px]">
            <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <span>{current?.name ?? "ROOKIE"} → {next?.name ?? "MAX"}</span>
              <span className="text-neon">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full bg-neon transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
              {xp.toLocaleString()} XP · LVL {stats?.level ?? 1}
            </div>
          </div>
        </Panel>

        {/* Three big showcase cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ranks.map((r) => {
            const t = getRankTheme(r.name);
            const isCurrent = current?.name === r.name;
            const unlocked = xp >= r.minXp;
            return (
              <div
                key={r.name}
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-6 transition-all",
                  "flex flex-col items-center text-center",
                  isCurrent
                    ? "border-2 shadow-[0_0_44px_-6px] animate-glow-throb"
                    : unlocked
                      ? "border-white/10 bg-panel-elevated/60"
                      : "border-white/5 bg-background/40 opacity-70",
                )}
                style={
                  isCurrent
                    ? {
                        borderColor: t.primary,
                        background: `linear-gradient(160deg, ${t.primary}12, transparent 55%), rgba(0,0,0,0.55)`,
                        boxShadow: `0 0 60px -14px ${t.primary}, inset 0 0 40px -18px ${t.secondary ?? t.primary}`,
                      }
                    : undefined
                }
              >
                {/* Ambient background halo — never a frame around the badge */}
                <span
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    background: `radial-gradient(ellipse at 50% 20%, ${t.primary}22, transparent 60%)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.08]" />

                {isCurrent && (
                  <span
                    className="absolute right-3 top-3 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                    style={{ borderColor: t.primary, color: t.primary, background: `${t.primary}12` }}
                  >
                    Current Rank
                  </span>
                )}


                <div className="relative flex h-28 w-28 items-center justify-center">
                  {unlocked ? (
                    <BadgeGlow
                      src={r.badgeImage || null}
                      alt={r.name}
                      size={96}
                      primary={r.accent || t.primary}
                      secondary={t.secondary}
                      intensity="lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-black/40">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div
                  className="relative mt-4 font-display text-2xl font-black uppercase tracking-widest"
                  style={{ color: unlocked ? t.primary : undefined }}
                >
                  {r.name}
                </div>

                <div className="relative mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("h-4 w-4 transition-all")}
                      style={
                        i < t.stars
                          ? {
                              color: t.primary,
                              fill: t.primary,
                              filter: `drop-shadow(0 0 4px ${t.primary})`,
                            }
                          : { color: "rgba(255,255,255,0.15)" }
                      }
                    />
                  ))}
                </div>

                <div className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {r.minXp.toLocaleString()} – {Number.isFinite(r.maxXp) ? r.maxXp.toLocaleString() : "∞"} XP
                </div>

                {!unlocked && (
                  <div className="relative mt-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/80">
                    {(r.minXp - xp).toLocaleString()} XP TO UNLOCK
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
