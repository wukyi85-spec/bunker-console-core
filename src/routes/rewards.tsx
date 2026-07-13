import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { Gift, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  claimReward,
  listPlayerRewards,
  listRewardsCatalog,
} from "@/lib/bunker-supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const qc = useQueryClient();
  const catalogQ = useQuery({ queryKey: ["rewards_catalog"], queryFn: listRewardsCatalog });
  const earnedQ = useQuery({ queryKey: ["player_rewards"], queryFn: listPlayerRewards });

  const claim = useMutation({
    mutationFn: claimReward,
    onSuccess: () => {
      toast.success("REWARD CLAIMED");
      qc.invalidateQueries({ queryKey: ["player_rewards"] });
    },
    onError: () => toast.error("Could not claim reward"),
  });

  const earned = earnedQ.data ?? [];
  const catalog = catalogQ.data ?? [];
  const earnedByReward = new Map<string, typeof earned>();
  earned.forEach((e) => {
    const arr = earnedByReward.get(e.reward_id) ?? [];
    arr.push(e);
    earnedByReward.set(e.reward_id, arr);
  });

  return (
    <AppShell hideLogo hideNav>
      <div className="grid h-full w-full grid-cols-[1fr_360px] gap-4 animate-in fade-in duration-500">
        <Panel variant="elevated" corners className="corner-frame-lines flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <Gift className="h-4 w-4 text-neon" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Reward Vault
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1">
            {catalog.map((r) => {
              const owned = earnedByReward.get(r.id) ?? [];
              const unclaimed = owned.filter((o) => !o.claimed_at);
              const has = owned.length > 0;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex flex-col rounded-md border p-3 transition-all",
                    has
                      ? "border-neon/50 bg-neon/5"
                      : "border-white/10 bg-panel-elevated/40 opacity-70",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-background/60 text-lg">
                      {r.icon ?? "🎁"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                        {r.name}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {r.reward_type}
                      </div>
                    </div>
                    {has ? (
                      <CheckCircle2 className="h-4 w-4 text-neon" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {r.description && (
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {r.description}
                    </div>
                  )}
                  <div className="mt-auto pt-2">
                    {has ? (
                      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                        <span className="text-neon">
                          x{owned.length} EARNED · x{unclaimed.length} UNCLAIMED
                        </span>
                        {unclaimed[0] && (
                          <button
                            className="rounded-sm border border-neon/60 bg-neon/10 px-2 py-1 font-bold tracking-widest text-neon transition-colors hover:bg-neon/20"
                            onClick={() => claim.mutate(unclaimed[0].id)}
                            disabled={claim.isPending}
                          >
                            CLAIM
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        COMPLETE MISSIONS TO UNLOCK
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel variant="default" className="flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <CheckCircle2 className="h-4 w-4 text-neon" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Recent Drops
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {earned.length === 0 && (
              <div className="py-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                NO REWARDS YET — COMPLETE A MISSION
              </div>
            )}
            {earned.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2 rounded-sm border border-white/10 bg-background/40 p-2"
              >
                <span className="text-lg">{e.reward?.icon ?? "🎁"}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xs font-bold uppercase tracking-widest">
                    {e.reward?.name}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    {new Date(e.earned_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest",
                    e.claimed_at
                      ? "border-white/10 text-muted-foreground"
                      : "border-neon/60 bg-neon/10 text-neon",
                  )}
                >
                  {e.claimed_at ? "CLAIMED" : "NEW"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
