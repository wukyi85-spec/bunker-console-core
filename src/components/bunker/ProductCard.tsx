import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";
import { Package } from "lucide-react";

interface Props {
  product: Product;
  active?: boolean;
  onClick?: () => void;
}

const availabilityTone: Record<Product["availability"], string> = {
  "IN STOCK": "text-neon border-neon/40 bg-neon/10",
  "LOW STOCK": "text-amber-300 border-amber-400/40 bg-amber-400/10",
  "OUT OF STOCK": "text-destructive border-destructive/40 bg-destructive/10",
};

export function ProductCard({ product, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 text-left",
        "bg-gradient-to-b from-[rgb(30_30_30)] to-[rgb(16_16_16)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_44px_-18px_rgb(0_0_0/0.9)]",
        active
          ? "border-neon/60 shadow-[0_0_0_1px_color-mix(in_oklab,var(--neon)_45%,transparent),0_20px_44px_-16px_color-mix(in_oklab,var(--neon)_45%,transparent)]"
          : "border-white/8",
      )}
    >
      {/* Glass reflection */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Slot image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/8 bg-black/60">
        {active && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_14%,transparent)_0%,transparent_65%)]" />
        )}
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/25">
            <Package className="h-12 w-12 transition-colors group-hover:text-white/60" />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-sm border border-white/10 bg-black/70 px-1.5 font-mono text-[9px] uppercase tracking-widest text-white/60">
          {product.id}
        </div>
      </div>


      <div className="flex flex-col gap-1">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          {product.name}
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {product.strain} · {product.strainType}
        </span>
      </div>

      <span
        className={cn(
          "mt-auto inline-flex w-fit items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
          availabilityTone[product.availability],
        )}
      >
        <span className="h-1 w-1 rounded-full bg-current animate-hud-pulse" />
        {product.availability}
      </span>
    </button>
  );
}
