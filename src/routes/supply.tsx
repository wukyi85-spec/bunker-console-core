import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { ProductCard } from "@/components/bunker/ProductCard";
import {
  CATEGORIES,
  productsByCategory,
  type Product,
  type ProductCategory,
} from "@/lib/products";
import { addToLoadout } from "@/lib/loadout";
import { cn } from "@/lib/utils";
import { ChevronRight, Package, X } from "lucide-react";

export const Route = createFileRoute("/supply")({
  head: () => ({
    meta: [
      { title: "Supply Room — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupplyPage,
});

function SupplyPage() {
  const [category, setCategory] = useState<ProductCategory>("products");
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const navigate = useNavigate();

  const products = useMemo(() => productsByCategory(category), [category]);

  const handleAdd = () => {
    if (!selected || !size) return;
    const pkg = selected.sizes.find((s) => s.label === size);
    if (!pkg) return;
    addToLoadout({
      productId: selected.id,
      sizeLabel: pkg.label,
      grams: pkg.grams,
      pricePerGram: pkg.pricePerGram,
      quantity: 1,
    });
    navigate({ to: "/loadout" });
  };

  return (
    <AppShell>
      <div className="grid h-full w-full grid-cols-[200px_1fr_320px] gap-3 animate-in fade-in duration-500">
        {/* LEFT — Category menu */}
        <Panel variant="default" corners className="corner-frame-lines flex flex-col p-3">
          <div className="mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Inventory Terminal
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((cat) => {
              const active = cat.id === category;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setSelected(null);
                    setSize(null);
                  }}
                  className={cn(
                    "group relative flex flex-col gap-0.5 rounded-sm border px-3 py-2.5 text-left transition-all duration-300",
                    active
                      ? "border-neon/60 bg-panel-elevated shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                      : "border-border/50 bg-transparent hover:border-neon/30 hover:bg-panel-elevated/50",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-neon animate-hud-pulse" />
                  )}
                  <span
                    className={cn(
                      "font-display text-xs font-bold uppercase tracking-widest",
                      active ? "text-neon" : "text-foreground",
                    )}
                  >
                    {cat.label}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    {cat.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto border-t border-border/60 pt-2">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              // Signal: Secure
            </div>
          </div>
        </Panel>

        {/* CENTER — Product grid */}
        <Panel variant="default" className="flex min-h-0 flex-col p-3">
          <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-neon" />
              <span className="font-display text-xs font-bold uppercase tracking-widest">
                {CATEGORIES.find((c) => c.id === category)?.label}
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {products.length} UNITS
            </span>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                active={selected?.id === p.id}
                onClick={() => {
                  setSelected(p);
                  setSize(p.sizes[0]?.label ?? null);
                }}
              />
            ))}
          </div>
        </Panel>

        {/* RIGHT — Detail panel */}
        <div className="relative min-h-0">
          {selected ? (
            <Panel
              key={selected.id}
              variant="elevated"
              corners
              className="corner-frame-lines relative flex h-full flex-col overflow-hidden p-3 animate-in slide-in-from-right-6 fade-in duration-300"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute right-2 top-2 z-10 rounded-sm p-1 text-muted-foreground hover:text-neon"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Photo */}
              <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border/60 bg-hud">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_18%,transparent)_0%,transparent_65%)]" />
                {selected.image ? (
                  <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-14 w-14 text-neon/60" />
                  </div>
                )}
              </div>

              <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
                <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                  {selected.name}
                </h2>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neon">
                  {selected.strain}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {selected.description}
                </p>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <Stat label="THC" value={`${selected.thcPct}%`} />
                  <Stat label="Indica" value={`${selected.indicaPct}%`} />
                  <Stat label="Sativa" value={`${selected.sativaPct}%`} />
                </div>

                <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  Package Sizes
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {selected.sizes.map((s) => {
                    const active = size === s.label;
                    return (
                      <button
                        key={s.label}
                        onClick={() => setSize(s.label)}
                        className={cn(
                          "rounded-sm border px-2 py-2 font-display text-sm font-bold uppercase tracking-wider transition-all duration-200",
                          active
                            ? "border-neon bg-neon/10 text-neon shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--neon)_70%,transparent)]"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:border-neon/40 hover:text-foreground",
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <BunkerButton
                variant="primary"
                size="lg"
                className="mt-3 w-full"
                disabled={!size || selected.availability === "OUT OF STOCK"}
                onClick={handleAdd}
              >
                Add to Loadout <ChevronRight className="h-4 w-4" />
              </BunkerButton>
            </Panel>
          ) : (
            <Panel variant="default" className="flex h-full flex-col items-center justify-center p-6 text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <div className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Select a Unit
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Tap any card to inspect
              </p>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-background/50 px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-sm font-bold text-neon">{value}</div>
    </div>
  );
}
