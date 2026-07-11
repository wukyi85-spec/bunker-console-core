import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { AlertTriangle, Backpack, Package, Trash2 } from "lucide-react";
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
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getLoadout());
    return subscribeLoadout(() => setItems(getLoadout()));
  }, []);

  const { enriched, productTotal, totalGrams, minMet } = loadoutTotals(items);

  return (
    <AppShell>
      <div className="grid h-full w-full grid-cols-[1fr_320px] gap-3 animate-in fade-in duration-500">
        {/* LEFT — Items */}
        <Panel variant="default" className="flex min-h-0 flex-col p-3">
          <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Backpack className="h-3.5 w-3.5 text-neon" />
              <span className="font-display text-xs font-bold uppercase tracking-widest">
                Operator Loadout
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
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
                Requisition supplies from the arsenal
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
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-panel-elevated/60 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-border/60 bg-hud">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_15%,transparent)_0%,transparent_65%)]" />
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-neon/60" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                      {i.product?.name ?? i.productId}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      SIZE · {i.sizeLabel} · {i.grams}G
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
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* RIGHT — Totals */}
        <Panel variant="elevated" corners className="corner-frame-lines flex flex-col p-3">
          <div className="mb-2 border-b border-border/60 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              // Mission Payload
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <Row label="Product Total" value={`฿${productTotal.toLocaleString()}`} />
            <Row label="Total Weight" value={`${totalGrams} G`} />

            <div className="my-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="rounded-sm border border-border/60 bg-background/40 p-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Minimum Requirement
              </div>
              <div className="mt-0.5 font-display text-xs font-bold uppercase tracking-wider text-foreground">
                50G OR ฿1,000
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[10px] uppercase tracking-widest",
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
                      Math.max(totalGrams / 50, productTotal / 1000) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="my-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Grand Total
              </span>
              <span className="font-display text-lg font-bold text-neon">
                ฿{productTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {!minMet && enriched.length > 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-sm border border-amber-400/40 bg-amber-400/10 p-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <div>
                <div className="font-display text-[11px] font-bold uppercase tracking-widest text-amber-300">
                  Mission Requirement Not Met
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-200/80">
                  Minimum order 50G or ฿1,000
                </div>
              </div>
            </div>
          )}

          <BunkerButton
            variant="primary"
            size="lg"
            disabled={!minMet || enriched.length === 0}
            className="mt-3 w-full"
            onClick={() => navigate({ to: "/checkout" })}
          >
            Proceed to Checkout
          </BunkerButton>
        </Panel>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
