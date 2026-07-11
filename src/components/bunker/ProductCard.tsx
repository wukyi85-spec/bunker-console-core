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
        "group relative flex flex-col gap-2 rounded-md border bg-panel p-3 text-left",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-neon/50 hover:bg-panel-elevated",
        "hover:shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--neon)_50%,transparent)]",
        active ? "border-neon shadow-[0_0_0_1px_var(--neon),0_10px_30px_-10px_color-mix(in_oklab,var(--neon)_60%,transparent)]" : "border-border/60",
      )}
    >
      {/* Slot image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-border/60 bg-hud">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_15%,transparent)_0%,transparent_60%)]" />
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Package className="h-10 w-10 group-hover:text-neon/70 transition-colors" />
          </div>
        )}
        <div className="absolute left-1 top-1 rounded-sm border border-border/70 bg-background/70 px-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
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
