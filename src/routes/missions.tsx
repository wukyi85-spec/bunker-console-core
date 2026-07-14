import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { listOrders } from "@/lib/bunker-supabase";
import {
  getGameSettings,
  getSpecialMissions,
  getWeeklyMissions,
  type SheetMission,
} from "@/lib/sheets.functions";
import { CheckCircle2, Coins, Target, Trophy, Zap } from "lucide-react";
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

interface MissionWithProgress extends SheetMission {
  progress: number;
  done: boolean;
}

interface OrderSample {
  at: Date;
  grams: number;
  spend: number;
}

function computeProgress(
  missions: SheetMission[],
  windowStart: Date,
  orders: OrderSample[],
): MissionWithProgress[] {
  const scoped = orders.filter((o) => o.at >= windowStart);
  return missions.map((m) => {
    let progress = 0;
    if (m.metric === "order") {
      // Cumulative order count.
      progress = scoped.length;
    } else if (m.metric === "spend") {
      // Cumulative spend.
      progress = scoped.reduce((s, o) => s + o.spend, 0);
    } else {
      // WEIGHT: single-order rule — best single completed order, not a sum.
      progress = scoped.reduce((max, o) => Math.max(max, o.grams), 0);
    }
    return { ...m, progress, done: progress >= m.requirement };
  });
}

function MissionsPage() {
  const fetchWeekly = useServerFn(getWeeklyMissions);
  const fetchSpecial = useServerFn(getSpecialMissions);
  const fetchSettings = useServerFn(getGameSettings);

  const weeklyQ = useQuery({ queryKey: ["sheet_weekly_missions"], queryFn: fetchWeekly, staleTime: 60_000 });
  const specialQ = useQuery({ queryKey: ["sheet_special_missions"], queryFn: fetchSpecial, staleTime: 60_000 });
  const settingsQ = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings, staleTime: 60_000 });
  const ordersQ = useQuery({ queryKey: ["player_orders"], queryFn: listOrders });

  const now = new Date();
  const weeklyDays = settingsQ.data?.weekly_mission_reset_days ?? 7;
  const specialDays = settingsQ.data?.special_mission_reset_days ?? 15;
  const weeklyStart = new Date(now.getTime() - weeklyDays * 86400_000);
  const specialStart = new Date(now.getTime() - specialDays * 86400_000);

  // Only completed orders count toward missions.
  const orders: OrderSample[] = (ordersQ.data ?? [])
    .filter((o: any) => String(o.status ?? "").toLowerCase() === "completed")
    .map((o: any) => ({
      at: new Date(o.completed_at ?? o.created_at),
      grams: Number(o.total_grams ?? 0),
      spend: Number(o.grand_total ?? o.product_total ?? 0),
    }));

  const weekly = computeProgress(weeklyQ.data ?? [], weeklyStart, orders);
  const special = computeProgress(specialQ.data ?? [], specialStart, orders);

  return (
    <AppShell hideLogo hideNav>
      <div className="grid h-full w-full grid-cols-2 gap-4 animate-in fade-in duration-500">
        <MissionColumn
          title={`Weekly Missions · resets ${weeklyDays}d`}
          icon={<Target className="h-4 w-4 text-neon" />}
          missions={weekly}
        />
        <MissionColumn
          title={`Special Missions · resets ${specialDays}d`}
          icon={<Trophy className="h-4 w-4 text-neon" />}
          missions={special}
        />
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
  missions: MissionWithProgress[];
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
          const pct = Math.min(100, (m.progress / m.requirement) * 100);
          const unit = m.metric === "weight" ? "G" : m.metric === "spend" ? "฿" : "";
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-md border p-3 transition-all",
                m.done
                  ? "border-neon/70 bg-neon/5 shadow-[0_0_30px_-10px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                  : "border-white/10 bg-panel-elevated/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                      {m.mission}
                    </span>
                    {m.done && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-neon/60 bg-neon/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-neon">
                        <CheckCircle2 className="h-3 w-3" /> COMPLETE
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[10px] uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-neon">
                    <Zap className="h-3 w-3" /> {m.rewardXp} XP
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400/90">
                    <Coins className="h-3 w-3" /> {m.rewardGold}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>
                    {unit === "฿" ? "฿" : ""}
                    {m.progress.toLocaleString()}
                    {unit === "G" ? "G" : ""} / {unit === "฿" ? "฿" : ""}
                    {m.requirement.toLocaleString()}
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
