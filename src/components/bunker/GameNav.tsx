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
    <nav className="flex items-stretch gap-2 rounded-md p-1.5 glass-panel">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = item.match ? item.match(pathname) : pathname === item.to;
        return (
          <Link
            key={i}
            to={item.to}
            className={cn(
              "group relative flex min-w-[104px] flex-col items-center justify-center gap-1 overflow-hidden",
              "rounded-sm px-4 py-2 transition-all duration-300 select-none",
              "border",
              isActive
                ? "border-neon/60 bg-panel-elevated text-neon shadow-[0_0_20px_-4px_color-mix(in_oklab,var(--neon)_55%,transparent),inset_0_1px_0_0_color-mix(in_oklab,var(--neon)_25%,transparent)]"
                : "border-border/50 bg-panel/40 text-muted-foreground hover:border-neon/40 hover:text-foreground hover:bg-panel-elevated/70 hover:shadow-[0_0_16px_-6px_color-mix(in_oklab,var(--neon)_50%,transparent)]",
              "active:scale-[0.97]",
            )}
          >
            {/* Hover sweep */}
            <span className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute -inset-y-4 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-neon/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-btn-sweep" />
            </span>

            {/* Corner ticks */}
            <span
              className={cn(
                "pointer-events-none absolute left-1 top-1 h-1.5 w-1.5 border-l border-t transition-colors",
                isActive ? "border-neon" : "border-border/60 group-hover:border-neon/60",
              )}
            />
            <span
              className={cn(
                "pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 border-b border-r transition-colors",
                isActive ? "border-neon" : "border-border/60 group-hover:border-neon/60",
              )}
            />

            <Icon
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                "group-hover:-translate-y-0.5 group-active:translate-y-0",
                isActive && "drop-shadow-[0_0_6px_color-mix(in_oklab,var(--neon)_70%,transparent)]",
              )}
            />
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em]">
              {item.label}
            </span>

            {/* Active underline */}
            <span
              className={cn(
                "absolute inset-x-2 bottom-0 h-px transition-opacity",
                isActive ? "bg-neon opacity-100 shadow-[0_0_6px_var(--neon)]" : "opacity-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
