import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { listMissions } from "@/lib/bunker-supabase";
import { Target, CheckCircle2, Coins, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MissionsPage,
});

function MissionsPage() {
  const q = useQuery({ queryKey: ["missions"], queryFn: listMissions });
  const missions = q.data ?? [];
  const weekly = missions.filter((m) => m.mission_type === "weekly");
  const special = missions.filter((m) => m.mission_type !== "weekly");

  return (
    <AppShell>
      <div className="grid h-full w-full grid-cols-2 gap-4 animate-in fade-in duration-500">
        <MissionColumn title="Weekly Missions" icon={<Target className="h-4 w-4 text-neon" />} missions={weekly} />
        <MissionColumn title="Special Missions" icon={<Trophy className="h-4 w-4 text-neon" />} missions={special} />
      </div>
    </AppShell>
  );
}

function MissionColumn({
  title,
  icon,
  missions,
}: {
  title: string;
  icon: React.ReactNode;
  missions: Awaited<ReturnType<typeof listMissions>>;
}) {
  return (
    <Panel variant="elevated" corners className="corner-frame-lines flex min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
        {icon}
        <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">{title}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {missions.length === 0 && (
          <div className="py-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            NO ACTIVE MISSIONS
          </div>
        )}
        {missions.map((m) => {
          const pct = Math.min(100, (m.progress / m.target_value) * 100);
          const done = !!m.completed_at;
          const unit = m.metric === "grams" ? "G" : m.metric === "thb" ? "฿" : "";
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-md border p-3 transition-all",
                done
                  ? "border-neon/70 bg-neon/5 shadow-[0_0_30px_-10px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                  : "border-white/10 bg-panel-elevated/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                      {m.title}
                    </span>
                    {done && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-neon/60 bg-neon/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-neon">
                        <CheckCircle2 className="h-3 w-3" /> COMPLETE
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.description}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[10px] uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-neon">
                    <Zap className="h-3 w-3" /> {m.xp_reward} XP
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400/90">
                    <Coins className="h-3 w-3" /> {m.gold_reward}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>
                    {unit === "฿" ? "฿" : ""}
                    {m.progress.toLocaleString()}
                    {unit === "G" ? "G" : ""} / {unit === "฿" ? "฿" : ""}
                    {m.target_value.toLocaleString()}
                    {unit === "G" ? "G" : ""}
                  </span>
                  <span className="text-neon">{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full bg-neon transition-[width] duration-1000 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
