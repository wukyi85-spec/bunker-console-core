import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { Gift, CheckCircle2, Ticket, Coins, Lock, Package, Trash2, Backpack } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSheetRewards,
  getGameSettings,
  type SheetReward,
} from "@/lib/sheets.functions";
import {
  addToRewardLoadout,
  clearRewardLoadout,
  getRewardLoadout,
  removeRewardLoadoutIndex,
  rewardLoadoutTotals,
  setCheckoutMode,
  subscribeRewardLoadout,
  type RewardLoadoutItem,
} from "@/lib/reward-loadout";
import {
  getPlayerStats,
  listPlayerVouchers,
  redeemShopReward,
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
  const navigate = useNavigate();
  const fetchRewards = useServerFn(getSheetRewards);
  const fetchSettings = useServerFn(getGameSettings);

  const rewardsQ = useQuery({ queryKey: ["sheet_rewards"], queryFn: fetchRewards });
  const settingsQ = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings });
  const statsQ = useQuery({ queryKey: ["player_stats"], queryFn: getPlayerStats });
  const vouchersQ = useQuery({ queryKey: ["player_vouchers"], queryFn: listPlayerVouchers });

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [rewardCart, setRewardCart] = useState<RewardLoadoutItem[]>(getRewardLoadout);

  useEffect(() => {
    setRewardCart(getRewardLoadout());
    return subscribeRewardLoadout(() => setRewardCart(getRewardLoadout()));
  }, []);

  const redeem = useMutation({
    mutationFn: (r: SheetReward) =>
      redeemShopReward({
        rewardId: r.id,
        rewardName: r.name,
        goldCost: r.goldCost,
        type: r.type,
        // Physical: no discount value. Voucher: percent-based discount is stored server-side.
        discountAmount: 0,
        expireDays: settingsQ.data?.voucher_expire_days,
      }),
    onSuccess: (result, r) => {
      if (result.kind === "voucher" && result.voucher) {
        toast.success(`VOUCHER CODE: ${result.voucher.code}`);
      } else {
        // Physical: add to client-side Reward Loadout for reward-type checkout.
        addToRewardLoadout({
          rewardId: r.id,
          rewardName: r.name,
          image: r.image,
          goldCost: r.goldCost,
        });
        toast.success(`${r.name} — ADDED TO REWARD LOADOUT`);
      }
      qc.invalidateQueries({ queryKey: ["player_stats"] });
      qc.invalidateQueries({ queryKey: ["player_vouchers"] });
      qc.invalidateQueries({ queryKey: ["player_rewards"] });
      setConfirmId(null);
    },
    onError: (e: any) => {
      toast.error(e?.message || "REDEMPTION FAILED");
      setConfirmId(null);
    },
  });

  const rewards = rewardsQ.data ?? [];
  const gold = statsQ.data?.gold ?? 0;
  const vouchers = vouchersQ.data ?? [];
  const rewardTotals = rewardLoadoutTotals(rewardCart);

  const confirmReward = useMemo(
    () => rewards.find((r) => r.id === confirmId) ?? null,
    [rewards, confirmId],
  );

  function handleCheckoutRewards() {
    if (rewardCart.length === 0) return;
    setCheckoutMode("reward");
    navigate({ to: "/checkout" });
  }

  return (
    <AppShell hideLogo hideNav>
      <div className="grid h-full w-full grid-cols-[1fr_340px] gap-4 animate-in fade-in duration-500">
        <Panel variant="elevated" corners className="corner-frame-lines flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-neon" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
                Reward Vault
              </span>
            </div>
            <span className="flex items-center gap-1 rounded-sm border border-neon/40 bg-neon/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-neon">
              <Coins className="h-3 w-3" /> {gold.toLocaleString()}
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1">
            {rewards.length === 0 && (
              <div className="col-span-2 py-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                LOADING SUPPLY...
              </div>
            )}
            {rewards.map((r) => {
              const canAfford = gold >= r.goldCost;
              const disabled = !r.inStock || !canAfford;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex flex-col rounded-md border p-3 transition-all",
                    r.inStock
                      ? "border-white/10 bg-panel-elevated/60"
                      : "border-white/5 bg-background/30 opacity-55",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-background/60">
                      {r.image ? (
                        <img
                          src={r.image}
                          alt={r.name}
                          className={cn(
                            "h-full w-full object-cover",
                            !r.inStock && "grayscale blur-[1px]",
                          )}
                        />
                      ) : r.type === "voucher" ? (
                        <Ticket className="h-6 w-6 text-neon" />
                      ) : (
                        <Gift className="h-6 w-6 text-neon" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                        {r.name}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {r.type === "voucher" ? "VOUCHER" : "PHYSICAL"}
                        {r.type === "physical" && " · SINGLE ITEM ONLY"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-widest text-yellow-400/90">
                      <Coins className="h-3 w-3" /> {r.goldCost.toLocaleString()}
                    </span>
                    {r.inStock ? (
                      <button
                        disabled={disabled || redeem.isPending}
                        onClick={() => setConfirmId(r.id)}
                        className={cn(
                          "rounded-sm border px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-widest transition-all",
                          canAfford
                            ? "border-neon/60 bg-neon/10 text-neon hover:bg-neon/20"
                            : "cursor-not-allowed border-white/10 bg-background/40 text-muted-foreground",
                        )}
                      >
                        {canAfford ? "REDEEM" : "NEED GOLD"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-destructive">
                        <Lock className="h-3 w-3" /> OUT OF STOCK
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* RIGHT column: Reward Loadout + Vouchers */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Reward Loadout */}
          <Panel variant="default" className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Backpack className="h-4 w-4 text-neon" />
                <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
                  Reward Loadout
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {rewardTotals.count} ITEM{rewardTotals.count === 1 ? "" : "S"}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {rewardCart.length === 0 ? (
                <div className="py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  REDEEM A PHYSICAL REWARD TO ADD IT HERE
                </div>
              ) : (
                rewardCart.map((it, idx) => (
                  <div
                    key={`${it.rewardId}-${idx}`}
                    className="flex items-center gap-2 rounded-sm border border-white/10 bg-background/40 p-2"
                  >
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-hud">
                      {it.image ? (
                        <img src={it.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-neon/70" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[11px] font-bold uppercase tracking-wider">
                        {it.rewardName}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-yellow-400/80">
                        {it.goldCost.toLocaleString()} GOLD PAID
                      </div>
                    </div>
                    <button
                      onClick={() => removeRewardLoadoutIndex(idx)}
                      className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              disabled={rewardCart.length === 0}
              onClick={handleCheckoutRewards}
              className={cn(
                "mt-3 w-full rounded-sm border py-2 font-display text-xs font-bold uppercase tracking-widest transition-all",
                rewardCart.length > 0
                  ? "border-neon bg-neon/10 text-neon hover:bg-neon/20"
                  : "cursor-not-allowed border-white/10 bg-background/40 text-muted-foreground",
              )}
            >
              CHECKOUT REWARDS · FREE DELIVERY
            </button>
            <div className="mt-1.5 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
              Reward orders cannot be mixed with Supply Room products.
            </div>
          </Panel>

          {/* Vouchers wallet */}
          <Panel variant="default" className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
              <Ticket className="h-4 w-4 text-neon" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
                My Vouchers
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {vouchers.length === 0 && (
                <div className="py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  NO VOUCHERS YET — REDEEM ONE
                </div>
              )}
              {vouchers.map((v) => {
                const expired = v.expires_at ? new Date(v.expires_at).getTime() < Date.now() : false;
                const used = !!v.redeemed_at;
                const percent = Number(v.discount_percent ?? 10);
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "rounded-sm border border-white/10 bg-background/40 p-2.5",
                      (expired || used) && "opacity-50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[11px] font-bold uppercase tracking-widest">
                        {v.reward_name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest",
                          used
                            ? "border-white/10 text-muted-foreground"
                            : expired
                              ? "border-destructive/40 text-destructive"
                              : "border-neon/60 bg-neon/10 text-neon",
                        )}
                      >
                        {used ? "USED" : expired ? "EXPIRED" : "ACTIVE"}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-neon/80">
                      {percent}% OFF · CAP FROM SETTINGS
                    </div>
                    <div className="mt-1 select-all rounded-sm border border-dashed border-neon/40 bg-black/40 px-2 py-1 font-mono text-[12px] tracking-widest text-neon">
                      {v.code}
                    </div>
                    {v.expires_at && (
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        Expires {new Date(v.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>


      {confirmReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-[420px] rounded-md border border-neon/40 bg-panel-elevated p-5 shadow-[0_0_60px_-10px_var(--neon)]">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <CheckCircle2 className="h-4 w-4 text-neon" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
                Confirm Redemption
              </span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <div className="flex justify-between">
                <span>Reward</span>
                <span className="text-foreground">{confirmReward.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="text-foreground">{confirmReward.type.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost</span>
                <span className="text-yellow-400">{confirmReward.goldCost} GOLD</span>
              </div>
            </div>
            {confirmReward.type === "physical" && (
              <div className="mt-3 rounded-sm border border-amber-400/40 bg-amber-400/5 p-2 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                Physical rewards ship as a single item. Delivery is free.
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmId(null)}
                disabled={redeem.isPending}
                className="flex-1 rounded-sm border border-white/10 bg-background/40 py-2 font-display text-xs font-bold uppercase tracking-widest hover:border-white/25"
              >
                Cancel
              </button>
              <button
                onClick={() => redeem.mutate(confirmReward)}
                disabled={redeem.isPending}
                className="flex-1 rounded-sm border border-neon bg-neon/10 py-2 font-display text-xs font-bold uppercase tracking-widest text-neon hover:bg-neon/20"
              >
                {redeem.isPending ? "REDEEMING..." : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
