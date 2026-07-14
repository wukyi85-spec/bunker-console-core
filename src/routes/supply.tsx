import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProducts, type SheetProduct } from "@/lib/products.functions";
import { addToLoadout, getLoadout, subscribeLoadout } from "@/lib/loadout";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { QuantityStepper } from "@/components/bunker/QuantityStepper";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Backpack,
  Loader2,
  Package,
  ShieldAlert,
  X,
} from "lucide-react";

export const Route = createFileRoute("/supply")({
  head: () => ({
    meta: [
      { title: "Supply Room — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupplyPage,
});

const availabilityTone: Record<SheetProduct["availability"], string> = {
  "IN STOCK": "text-neon border-neon/40 bg-neon/10",
  "LOW STOCK": "text-amber-300 border-amber-400/40 bg-amber-400/10",
  "OUT OF STOCK": "text-destructive border-destructive/40 bg-destructive/10",
};

function formatCategoryLabel(id: string): string {
  return id
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
}

function SupplyPage() {
  const fetchProducts = useServerFn(getProducts);
  const { data, isLoading, isError, refetch } = useQuery<SheetProduct[]>({
    queryKey: ["supply-products"],
    queryFn: () => fetchProducts() as Promise<SheetProduct[]>,
    staleTime: 60_000,
  });

  const products: SheetProduct[] = data ?? [];
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return Array.from(map.entries()).map(([id, count]) => ({
      id,
      label: formatCategoryLabel(id),
      count,
    }));
  }, [products]);

  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [selected, setSelected] = useState<SheetProduct | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const [loadoutCount, setLoadoutCount] = useState(0);
  useEffect(() => {
    const sync = () =>
      setLoadoutCount(getLoadout().reduce((s, i) => s + i.quantity, 0));
    sync();
    return subscribeLoadout(sync);
  }, []);

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const openProduct = (p: SheetProduct) => {
    setSelected(p);
    setSize(p.sizes[0]?.label ?? null);
    setQty(1);
  };

  const closeDrawer = () => setSelected(null);

  const handleAdd = () => {
    if (!selected || !size) return;
    const pkg = selected.sizes.find((s) => s.label === size);
    if (!pkg) return;
    addToLoadout({
      productId: selected.id,
      sizeLabel: pkg.label,
      grams: pkg.grams,
      pricePerGram: pkg.pricePerGram,
      quantity: qty,
      productName: selected.name,
      productImage: selected.image || undefined,
      category: selected.category,
    });
    closeDrawer();
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.035)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgb(0_0_0/0.6)_0%,transparent_70%)]" />

      {/* Header bar */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/8 px-5 py-3 lphone:px-3 lphone:py-1.5">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full",
              "border border-white/10 bg-black/50 backdrop-blur-md",
              "px-3.5 py-1.5 text-[11px] font-display font-bold uppercase tracking-[0.28em] lphone:px-2.5 lphone:py-1 lphone:text-[9px] lphone:tracking-[0.22em]",
              "text-white/70 hover:text-white",
              "transition-all duration-300 hover:border-white/25 hover:bg-black/70",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 lphone:h-3 lphone:w-3" />
            <span>Back to Bunker</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex lphone:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Supply Room · Inventory Terminal
            </span>
          </div>
        </div>


        <Link
          to="/loadout"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 text-[11px] font-display font-bold uppercase tracking-[0.28em] text-white/80 backdrop-blur-md transition-all hover:border-neon/50 hover:text-neon"
        >
          <Backpack className="h-3.5 w-3.5" />
          <span>Loadout</span>
          <span
            className={cn(
              "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[10px]",
              loadoutCount > 0
                ? "bg-neon text-black"
                : "bg-white/10 text-white/60",
            )}
          >
            {loadoutCount}
          </span>
        </Link>
      </div>

      {/* Main grid — fills the rest of the viewport */}
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[180px_1fr_360px] gap-0 lphone:grid-cols-[128px_1fr_260px]">
        {/* LEFT — Category rail */}
        <aside className="relative flex min-h-0 flex-col border-r border-white/8 bg-black/30 p-3 lphone:p-2">
          <div className="mb-3 flex items-center gap-2 border-b border-white/8 pb-2 lphone:mb-1.5 lphone:pb-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground lphone:text-[8px] lphone:tracking-[0.28em]">
              Categories
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
            <CategoryButton
              label="All Supply"
              hint={`${products.length} units`}
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {categories.map((c) => (
              <CategoryButton
                key={c.id}
                label={c.label}
                hint={`${c.count} units`}
                active={activeCategory === c.id}
                onClick={() => setActiveCategory(c.id)}
              />
            ))}
          </div>
          <div className="mt-2 border-t border-white/8 pt-2 lphone:hidden">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              // Signal: Secure
            </div>
          </div>
        </aside>

        {/* CENTER — Product grid */}
        <main className="relative flex min-h-0 flex-col p-5 lphone:p-2.5">
          {isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <Loader2 className="mb-3 h-6 w-6 animate-spin text-neon" />
              <div className="font-mono text-[10px] uppercase tracking-[0.4em]">
                Syncing Inventory…
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <ShieldAlert className="mb-3 h-8 w-8 text-destructive" />
              <div className="font-display text-sm font-bold uppercase tracking-widest text-destructive">
                Feed Offline
              </div>
              <p className="mt-1 max-w-xs font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Could not reach supply channel. Verify sheet access.
              </p>
              <BunkerButton variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </BunkerButton>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              <div className="mb-3 flex items-center justify-between lphone:mb-1.5">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-neon lphone:h-3 lphone:w-3" />
                  <span className="font-display text-xs font-bold uppercase tracking-widest lphone:text-[10px] lphone:tracking-widest">
                    {activeCategory === "all"
                      ? "All Supply"
                      : formatCategoryLabel(activeCategory)}
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground lphone:text-[8px]">
                  {filtered.length} UNITS
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                  <Package className="mb-3 h-8 w-8 opacity-30" />
                  <div className="font-mono text-[10px] uppercase tracking-widest">
                    No units in this channel
                  </div>
                </div>
              ) : (
                <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-4 overflow-y-auto pr-1 md:grid-cols-3 lphone:grid-cols-1 lphone:gap-1.5">
                  {filtered.map((p) => (
                    <ProductTile
                      key={p.id}
                      product={p}
                      active={selected?.id === p.id}
                      onClick={() => openProduct(p)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>


        {/* RIGHT — Inline detail panel */}
        <aside className="relative flex min-h-0 flex-col border-l border-white/10 bg-gradient-to-b from-[rgb(20_20_20)] to-[rgb(10_10_10)]">
          {selected ? (
            <ProductDrawer
              product={selected}
              size={size}
              qty={qty}
              onSize={setSize}
              onQty={(d) => setQty((v) => Math.max(1, v + d))}
              onClose={closeDrawer}
              onAdd={handleAdd}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <Package className="h-9 w-9 opacity-30" />
              <div className="font-display text-xs font-bold uppercase tracking-widest text-white/60">
                Select a Unit
              </div>
              <p className="max-w-[220px] font-mono text-[9.5px] uppercase leading-relaxed tracking-widest text-muted-foreground/70">
                Tap any product to load its specs and add it to your loadout.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function CategoryButton({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-0.5 rounded-md border px-3 py-2.5 text-left transition-all duration-300",
        active
          ? "border-neon/50 bg-panel-elevated shadow-[0_0_24px_-8px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
          : "border-white/8 bg-transparent hover:border-white/25 hover:bg-white/[0.03]",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-neon animate-hud-pulse" />
      )}
      <span
        className={cn(
          "font-display text-xs font-bold uppercase tracking-widest",
          active ? "text-neon" : "text-foreground/90",
        )}
      >
        {label}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {hint}
      </span>
    </button>
  );
}

function ProductTile({
  product,
  active,
  onClick,
}: {
  product: SheetProduct;
  active: boolean;
  onClick: () => void;
}) {
  const outOfStock = product.availability === "OUT OF STOCK";
  return (
    <button
      onClick={onClick}
      disabled={outOfStock}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border text-left",
        "bg-gradient-to-b from-[rgb(28_28_28)] to-[rgb(14_14_14)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_28px_60px_-20px_rgb(0_0_0/0.95)]",
        active
          ? "border-neon/60 shadow-[0_0_0_1px_color-mix(in_oklab,var(--neon)_55%,transparent),0_30px_60px_-18px_color-mix(in_oklab,var(--neon)_50%,transparent)]"
          : "border-white/8",
        outOfStock && "opacity-55 hover:translate-y-0",
      )}
    >
      {/* Glass reflection */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-white/8 bg-black/60">
        {active && (
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_14%,transparent)_0%,transparent_70%)]" />
        )}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]",
              outOfStock && "grayscale blur-[1px] opacity-70",
            )}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/25">
            <Package className="h-14 w-14 transition-colors group-hover:text-white/60" />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="rounded-sm border border-destructive/60 bg-destructive/20 px-2 py-1 font-display text-[11px] font-bold uppercase tracking-[0.28em] text-destructive">
              Out of Stock
            </span>
          </div>
        )}


        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.newDrop && (
            <span className="rounded-sm border border-neon/50 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neon">
              New Drop
            </span>
          )}
          {product.popular && (
            <span className="rounded-sm border border-white/20 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/80">
              Popular
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-bold uppercase leading-tight tracking-wider text-foreground">
            {product.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
              availabilityTone[product.availability],
            )}
          >
            {product.availability === "IN STOCK"
              ? "In Stock"
              : product.availability === "LOW STOCK"
                ? "Low"
                : "Out"}
          </span>
        </div>

        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {formatCategoryLabel(product.category)}
        </div>

        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {product.sizes.map((s) => (
            <span
              key={s.label}
              className="rounded-sm border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-widest text-white/70"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function ProductDrawer({
  product,
  size,
  qty,
  onSize,
  onQty,
  onClose,
  onAdd,
}: {
  product: SheetProduct;
  size: string | null;
  qty: number;
  onSize: (label: string) => void;
  onQty: (delta: number) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const pkg = product.sizes.find((s) => s.label === size) ?? product.sizes[0];
  const subtotal = pkg ? pkg.totalPrice * qty : 0;
  const outOfStock = product.availability === "OUT OF STOCK";

  return (
    <div className="flex h-full flex-col">
      {/* Image header */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-white/10 bg-black">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-16 w-16 text-white/25" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/80 backdrop-blur-md transition hover:border-neon/50 hover:text-neon"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            {formatCategoryLabel(product.category)}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase leading-none tracking-wider text-foreground">
            {product.name}
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
        {product.description && (
          <p className="text-sm leading-relaxed text-white/70">{product.description}</p>
        )}

        {(product.thc || product.indica || product.sativa) > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <Stat label="THC" value={`${product.thc}%`} />
            <Stat label="Indica" value={`${product.indica}%`} />
            <Stat label="Sativa" value={`${product.sativa}%`} />
          </div>
        )}

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            Available Sizes
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.sizes.map((s) => {
              const active = size === s.label;
              return (
                <button
                  key={s.label}
                  onClick={() => onSize(s.label)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-all",
                    active
                      ? "border-neon bg-neon/10 shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--neon)_70%,transparent)]"
                      : "border-white/10 bg-black/40 hover:border-white/30",
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-base font-bold uppercase tracking-wider",
                      active ? "text-neon" : "text-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-widest",
                      active ? "text-neon/80" : "text-muted-foreground",
                    )}
                  >
                    ฿{s.totalPrice.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            Current Stock
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-widest",
              availabilityTone[product.availability],
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-hud-pulse" />
            {product.stockLabel || product.availability}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 bg-black/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Quantity
            </span>
            <QuantityStepper value={qty} onChange={onQty} />
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Subtotal
            </div>
            <div className="font-display text-lg font-bold text-neon">
              ฿{subtotal.toLocaleString()}
            </div>
          </div>
        </div>

        <BunkerButton
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!size || outOfStock}
          onClick={onAdd}
        >
          Add to Loadout
        </BunkerButton>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/40 px-2.5 py-2">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-base font-bold text-neon">{value}</div>
    </div>
  );
}
