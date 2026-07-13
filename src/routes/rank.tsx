import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { listRanks, getPlayerStats } from "@/lib/bunker-supabase";
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
  const ranksQ = useQuery({ queryKey: ["ranks"], queryFn: listRanks });
  const statsQ = useQuery({ queryKey: ["player_stats"], queryFn: getPlayerStats });

  const ranks = ranksQ.data ?? [];
  const stats = statsQ.data;
  const xp = stats?.xp ?? 0;
  const current = ranks.find(
    (r) => xp >= r.min_xp && (r.max_xp == null || xp <= r.max_xp),
  );
  const next = ranks.find((r) => r.min_xp > xp);
  const progress = next
    ? Math.min(100, ((xp - (current?.min_xp ?? 0)) / (next.min_xp - (current?.min_xp ?? 0))) * 100)
    : 100;

  return (
    <AppShell hideLogo hideNav>
      <div className="grid h-full w-full grid-cols-[360px_1fr] gap-4 animate-in fade-in duration-500">
        {/* LEFT — Current rank + stats */}
        <Panel variant="elevated" corners className="corner-frame-lines flex flex-col p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <Trophy className="h-4 w-4 text-neon" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Operator Status
            </span>
          </div>

          <div className="flex flex-col items-center py-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-neon/60 bg-background shadow-[0_0_40px_-8px_color-mix(in_oklab,var(--neon)_60%,transparent)]">
              <span className="absolute inset-0 rounded-full bg-neon/10 blur-2xl" />
              <span
                className="relative font-display text-2xl font-black uppercase tracking-widest"
                style={{ color: current?.accent ?? "var(--neon)" }}
              >
                {current?.name?.[0] ?? "R"}
              </span>
            </div>
            <div
              className="mt-3 font-display text-2xl font-bold uppercase tracking-widest"
              style={{ color: current?.accent ?? "var(--neon)" }}
            >
              {current?.name ?? "Rookie"}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              LVL {stats?.level ?? 1} · {xp.toLocaleString()} XP
            </div>
          </div>

          {/* XP progress */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Progress to {next?.name ?? "MAX"}</span>
              <span className="text-neon">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full bg-neon transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            {next && (
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                {(next.min_xp - xp).toLocaleString()} XP TO NEXT RANK
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <StatCell label="Gold" value={(stats?.gold ?? 0).toLocaleString()} />
            <StatCell label="Activity" value={String(stats?.activity ?? 0)} />
            <StatCell label="Total Purchase" value={`฿${Number(stats?.total_purchase ?? 0).toLocaleString()}`} />
            <StatCell label="Total Weight" value={`${Number(stats?.total_weight ?? 0)}G`} />
          </div>
        </Panel>

        {/* RIGHT — All ranks */}
        <Panel variant="default" className="flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <Star className="h-4 w-4 text-neon" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Rank Ladder
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {ranks.map((r) => {
              const isCurrent = current?.id === r.id;
              const unlocked = xp >= r.min_xp;
              const rewards = Array.isArray(r.rewards) ? (r.rewards as unknown[]) : [];
              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-md border p-3 transition-all",
                    isCurrent
                      ? "border-neon/70 bg-neon/5 shadow-[0_0_30px_-10px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                      : unlocked
                      ? "border-white/10 bg-panel-elevated/60"
                      : "border-white/5 bg-background/30 opacity-60",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border font-display text-sm font-bold uppercase",
                        isCurrent ? "border-neon" : "border-white/20",
                      )}
                      style={{ color: r.accent ?? undefined }}
                    >
                      {unlocked ? r.name[0] : <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-display text-base font-bold uppercase tracking-widest"
                          style={{ color: unlocked ? r.accent ?? "var(--foreground)" : undefined }}
                        >
                          {r.name}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full border border-neon/60 bg-neon/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-neon">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {r.min_xp.toLocaleString()} – {r.max_xp?.toLocaleString() ?? "∞"} XP
                      </div>
                    </div>
                  </div>
                  {rewards.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
                      {rewards.map((rw, i) => (
                        <span
                          key={i}
                          className="rounded-sm border border-white/10 bg-background/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
                        >
                          {String(rw)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-background/40 p-2">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
