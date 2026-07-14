import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { QuantityStepper } from "@/components/bunker/QuantityStepper";
import {
  getLoadout,
  subscribeLoadout,
  updateQuantity,
  removeFromLoadout,
  loadoutTotals,
} from "@/lib/loadout";
import { getGameSettings } from "@/lib/sheets.functions";
import { AlertTriangle, Backpack, Package, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loadout")({
  head: () => ({
    meta: [
      { title: "Loadout — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoadoutPage,
});

function LoadoutPage() {
  const [items, setItems] = useState(getLoadout);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const navigate = useNavigate();
  const fetchSettings = useServerFn(getGameSettings);
  const settingsQ = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings, staleTime: 60_000 });
  const minAmount = settingsQ.data?.minimum_order_amount ?? 0;
  const minWeight = settingsQ.data?.minimum_order_weight ?? 0;
  const settingsReady = minAmount > 0 && minWeight > 0;

  useEffect(() => {
    setItems(getLoadout());
    return subscribeLoadout(() => setItems(getLoadout()));
  }, []);

  const { enriched, productTotal, totalGrams, minMet } = loadoutTotals(items, {
    amount: minAmount,
    weight: minWeight,
  });

  const deliveryFee = 0;
  const grandTotal = productTotal + deliveryFee;

  return (
    <AppShell hideLogo hideNav>
      <div className="grid h-full w-full grid-cols-[1fr_360px] gap-4 animate-in fade-in duration-500 lphone:grid-cols-[1fr_300px] lphone:gap-2">
        {/* LEFT — Inventory */}
        <Panel variant="default" className="flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Backpack className="h-4 w-4 text-neon" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
                Loadout Inventory
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {enriched.length} ITEMS · {totalGrams}G
            </span>
          </div>

          {enriched.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <div className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Loadout Empty
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Requisition supplies from the Supply Room
              </p>
              <Link to="/supply">
                <BunkerButton variant="outline" className="mt-4">
                  Open Supply Room
                </BunkerButton>
              </Link>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto pr-1">
              {enriched.map((i) => (
                <div
                  key={`${i.productId}-${i.sizeLabel}`}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-panel-elevated/60 p-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-hud">
                    {i.productImage ? (
                      <img src={i.productImage} alt={i.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-7 w-7 text-neon/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-bold uppercase tracking-wider text-foreground truncate">
                      {i.productName ?? i.productId}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      SIZE · {i.sizeLabel} · {i.grams}G
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-neon/80">
                      ฿{i.pricePerGram.toFixed(0)}/G
                    </div>
                  </div>
                  <QuantityStepper
                    value={i.quantity}
                    onChange={(d) => updateQuantity(i.productId, i.sizeLabel, d)}
                  />
                  <div className="w-24 text-right">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      Subtotal
                    </div>
                    <div className="font-display text-sm font-bold text-neon">
                      ฿{i.subtotal.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromLoadout(i.productId, i.sizeLabel)}
                    className="rounded-sm p-2 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* RIGHT — Order Summary */}
        <Panel variant="elevated" corners className="corner-frame-lines flex min-h-0 flex-col p-3 lphone:p-2.5">
          <div className="mb-2 border-b border-white/10 pb-2 shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground lphone:text-[8px]">
              // Order Summary
            </span>
          </div>

          {/* Scrollable middle */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 text-xs lphone:text-[11px]">
            <Row label="Total Weight" value={`${totalGrams} G`} />
            <Row label="Product Total" value={`฿${productTotal.toLocaleString()}`} />
            <Row label="Delivery Fee" value="FREE" />

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="rounded-sm border border-white/10 bg-background/40 p-2 lphone:p-1.5">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground lphone:text-[8px]">
                Minimum Requirement
              </div>
              <div className="mt-0.5 font-display text-xs font-bold uppercase tracking-wider text-foreground lphone:text-[10px]">
                {minWeight}G OR ฿{minAmount.toLocaleString()}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[10px] uppercase tracking-widest lphone:text-[8px]",
                  minMet ? "text-neon" : "text-amber-300",
                )}
              >
                {minMet ? "REQUIREMENT MET" : "IN PROGRESS"}
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-background">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    minMet ? "bg-neon" : "bg-amber-400/70",
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(totalGrams / minWeight, productTotal / minAmount) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            {!minMet && enriched.length > 0 && (
              <div className="flex items-start gap-2 rounded-sm border border-amber-400/40 bg-amber-400/10 p-2 lphone:p-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                <div>
                  <div className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-300 lphone:text-[9px]">
                    Requirement Not Met
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-200/80 lphone:text-[8px]">
                    Min: {minWeight}G / ฿{minAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Order Policy */}
            {enriched.length > 0 && (
              <div className="rounded-sm border border-white/10 bg-background/40 p-2.5 lphone:p-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-neon" />
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground lphone:text-[10px]">
                    ORDER POLICY
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1 font-mono text-[10px] leading-snug uppercase tracking-wider text-muted-foreground lphone:text-[9px]">
                  <li className="flex items-start gap-1.5"><span className="text-neon">•</span><span>No rush orders.</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-neon">•</span><span>ETA 2–5 days.</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-neon">•</span><span>Answer delivery calls.</span></li>
                </ul>
                <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-sm border border-white/10 bg-background/60 p-2 hover:border-neon/40 lphone:p-1.5">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 accent-neon"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground lphone:text-[9px]">
                    I agree to the Order Policy.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="mt-2 shrink-0 border-t border-white/10 pt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground lphone:text-[8px]">
                Grand Total
              </span>
              <span className="font-display text-lg font-bold text-neon lphone:text-base">
                ฿{grandTotal.toLocaleString()}
              </span>
            </div>
            <BunkerButton
              variant="primary"
              size="lg"
              disabled={!minMet || !settingsReady || enriched.length === 0 || !policyAccepted}
              className="w-full lphone:!py-2 lphone:!text-xs"
              onClick={() => navigate({ to: "/checkout" })}
            >
              {settingsReady ? "Proceed to Checkout" : "Loading Settings..."}
            </BunkerButton>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-sm font-bold",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
