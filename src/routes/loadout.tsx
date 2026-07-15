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
import { AlertTriangle, Backpack, Package, Trash2, ShieldAlert, X, CheckCircle2 } from "lucide-react";
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
  const [showPolicy, setShowPolicy] = useState(false);
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
              disabled={!minMet || !settingsReady || enriched.length === 0}
              className="w-full lphone:!py-2 lphone:!text-xs"
              onClick={() => {
                setPolicyAccepted(false);
                setShowPolicy(true);
              }}
            >
              {settingsReady ? "Proceed to Checkout" : "Loading Settings..."}
            </BunkerButton>
          </div>
        </Panel>
      </div>

      {/* ORDER POLICY MODAL — must accept before continuing to checkout */}
      {showPolicy && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[640px] rounded-md border border-neon/40 bg-panel-elevated/95 shadow-[0_0_60px_-10px_rgba(124,255,77,0.35)] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPolicy(false)}
              className="absolute right-2 top-2 rounded-sm p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="border-b border-white/10 px-5 py-3 lphone:px-4 lphone:py-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-neon" />
                <span className="font-display text-sm font-black uppercase tracking-[0.28em] text-foreground lphone:text-xs">
                  Order Policy — Please Read Carefully
                </span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 lphone:px-4 lphone:py-3">
            <div className="space-y-3 font-mono text-[13px] leading-relaxed text-foreground/95 lphone:space-y-2 lphone:text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <div>
                    <p className="font-bold text-neon">Prepaid only. Cash on Delivery is not supported.</p>
                    <p className="text-foreground/80">(ငွေကြိုပေးစနစ်သာရှိပါသည်။ COD မရှိပါ။)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <div>
                    <p className="font-bold text-neon">No rush orders.</p>
                    <p className="text-foreground/80">(Rush order လက်မခံပါ။)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <div>
                    <p className="font-bold text-neon">Please remain reachable for delivery calls to avoid delays.</p>
                    <p className="text-foreground/80">(Delivery ဖုန်းဆက်လာပါက ဖုန်းကိုင်ပေးပါ။ မကိုင်ပါက ကြာနိုင်ပါသည်။)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <div>
                    <p className="font-bold text-neon">Estimated delivery time: 2–5 days.</p>
                    <p className="text-foreground/80">(ပို့ဆောင်ချိန် ၂ မှ ၅ ရက်ခန့်ကြာနိုင်ပါသည်။)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <div>
                    <p className="font-bold text-neon">Record an unboxing video upon delivery for any claims.</p>
                    <p className="text-foreground/80">(ပါဆယ်ရောက်ပါက Unboxing video ရိုက်ထားမှသာ တာဝန်ယူပေးပါမည်။)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <div>
                    <p className="font-bold text-neon">Claims without video proof will not be accepted.</p>
                    <p className="text-foreground/80">(Video မရိုက်ထားပါက တာဝန်မယူပါ။)</p>
                  </div>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-sm border border-white/15 bg-background/60 p-3 hover:border-neon/50 lphone:mt-3 lphone:p-2.5">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-neon"
                />
                <span className="font-mono text-[12px] uppercase tracking-wider text-foreground lphone:text-[10px]">
                  အထက်ပါ Order Policy အားလုံးကို ဖတ်ရှုပြီး သဘောတူပါသည်။
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3 lphone:px-4 lphone:py-2">
              <BunkerButton
                variant="outline"
                size="sm"
                onClick={() => setShowPolicy(false)}
              >
                Cancel
              </BunkerButton>
              <BunkerButton
                variant="primary"
                size="sm"
                disabled={!policyAccepted}
                onClick={() => {
                  setShowPolicy(false);
                  navigate({ to: "/checkout" });
                }}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Accept & Continue
              </BunkerButton>
            </div>
          </div>
        </div>
      )}
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
