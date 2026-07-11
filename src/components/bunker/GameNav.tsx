import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Package,
  Backpack,
  ScrollText,
  Trophy,
  Gift,
  ClipboardList,
} from "lucide-react";
import type { ComponentType } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
}

// All routes point at existing pages (unbuilt sections fall through to
// /dashboard for now) so TanStack Router's type-safe Link stays valid.
const items: NavItem[] = [
  {
    to: "/supply",
    label: "Supply Room",
    icon: Package,
    match: (p) => p.startsWith("/supply"),
  },
  { to: "/loadout", label: "Loadout", icon: Backpack },
  { to: "/dashboard", label: "Mission", icon: ScrollText, match: () => false },
  { to: "/dashboard", label: "Rank", icon: Trophy, match: () => false },
  { to: "/dashboard", label: "Rewards", icon: Gift, match: () => false },
  { to: "/dashboard", label: "Mission Log", icon: ClipboardList, match: () => false },
];

export function GameNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="relative flex items-stretch gap-2.5 rounded-lg gunmetal-glass p-2">
      <span className="pointer-events-none absolute inset-0 rounded-lg carbon-weave opacity-50" />
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = item.match ? item.match(pathname) : pathname === item.to;
        return (
          <Link
            key={i}
            to={item.to}
            style={{ width: 170, height: 68 }}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1 overflow-hidden",
              "rounded-md px-3 transition-all duration-300 select-none",
              "metal-bevel border",
              isActive
                ? "border-neon/80 text-neon shadow-[0_0_28px_-4px_color-mix(in_oklab,var(--neon)_70%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--neon)_35%,transparent),inset_0_1px_0_0_rgb(255_255_255/0.12)]"
                : "border-white/5 text-muted-foreground hover:border-neon/50 hover:text-foreground hover:shadow-[0_0_22px_-8px_color-mix(in_oklab,var(--neon)_60%,transparent)]",
              "active:scale-[0.97] active:translate-y-[1px]",
            )}
          >
            {/* Carbon weave surface */}
            <span className="pointer-events-none absolute inset-0 rounded-md carbon-weave opacity-40" />

            {/* Hover sweep */}
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
              <span className="absolute -inset-y-6 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-neon/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-btn-sweep" />
            </span>

            {/* Top neon rail */}
            <span
              className={cn(
                "pointer-events-none absolute inset-x-3 top-0 h-px transition-opacity",
                isActive
                  ? "bg-neon opacity-100 shadow-[0_0_8px_var(--neon)]"
                  : "bg-neon/30 opacity-40 group-hover:opacity-80",
              )}
            />

            {/* Corner ticks */}
            <span
              className={cn(
                "pointer-events-none absolute left-1.5 top-1.5 h-2 w-2 border-l border-t transition-colors",
                isActive ? "border-neon" : "border-white/20 group-hover:border-neon/70",
              )}
            />
            <span
              className={cn(
                "pointer-events-none absolute bottom-1.5 right-1.5 h-2 w-2 border-b border-r transition-colors",
                isActive ? "border-neon" : "border-white/20 group-hover:border-neon/70",
              )}
            />

            <Icon
              className={cn(
                "relative h-6 w-6 transition-transform duration-300",
                "group-hover:-translate-y-0.5 group-active:translate-y-0",
                isActive && "drop-shadow-[0_0_8px_color-mix(in_oklab,var(--neon)_80%,transparent)]",
              )}
            />
            <span className="relative font-display text-[11px] font-black uppercase tracking-[0.24em]">
              {item.label}
            </span>

            {/* Active bottom glow */}
            <span
              className={cn(
                "pointer-events-none absolute inset-x-2 bottom-0 h-[2px] transition-opacity",
                isActive
                  ? "bg-neon opacity-100 shadow-[0_0_10px_var(--neon)]"
                  : "opacity-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

