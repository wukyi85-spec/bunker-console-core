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

const items: NavItem[] = [
  {
    to: "/supply",
    label: "Supply Room",
    icon: Package,
    match: (p) => p.startsWith("/supply"),
  },
  { to: "/loadout", label: "Loadout", icon: Backpack },
  { to: "/missions", label: "Mission", icon: ScrollText },
  { to: "/rank", label: "Rank", icon: Trophy },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/mission-log", label: "Order Details", icon: ClipboardList },
];

export function GameNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className={cn(
        "relative flex items-stretch gap-2.5 rounded-2xl p-2.5",
        "bg-black/55 backdrop-blur-xl",
        "border border-white/8",
        "shadow-[0_28px_60px_-24px_rgb(0_0_0/0.9),inset_0_1px_0_0_rgb(255_255_255/0.05)]",
      )}
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = item.match ? item.match(pathname) : pathname === item.to;
        return (
          <Link
            key={i}
            to={item.to}
            style={{ width: 168, height: 66 }}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1 overflow-hidden",
              "rounded-xl px-3 select-none",
              "transition-all duration-300 ease-out",
              // Matte black body with thin white border
              "bg-gradient-to-b from-[rgb(28_28_28)] to-[rgb(14_14_14)]",
              "border",
              isActive
                ? "border-neon/70 text-neon -translate-y-0.5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--neon)_55%,transparent),0_16px_36px_-14px_color-mix(in_oklab,var(--neon)_50%,transparent),inset_0_1px_0_0_rgb(255_255_255/0.06)]"
                : cn(
                    "border-white/10 text-white/60",
                    "hover:border-white/25 hover:text-white hover:-translate-y-0.5",
                    "hover:shadow-[0_14px_30px_-14px_rgb(0_0_0/0.85),inset_0_1px_0_0_rgb(255_255_255/0.06)]",
                  ),
              "active:translate-y-0 active:scale-[0.98]",
            )}
          >
            {/* Soft top highlight — glass reflection */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60"
            />

            {/* Hover sweep */}
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              <span className="absolute -inset-y-6 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-btn-sweep" />
            </span>

            {/* Active soft ambient glow */}
            {isActive && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--neon)_18%,transparent)_0%,transparent_70%)]"
              />
            )}

            <Icon
              className={cn(
                "relative h-[22px] w-[22px] transition-all duration-300",
                "group-hover:-translate-y-0.5",
                isActive &&
                  "drop-shadow-[0_0_10px_color-mix(in_oklab,var(--neon)_75%,transparent)]",
              )}
            />

            <span className="relative font-display text-[10.5px] font-bold uppercase tracking-[0.26em]">
              {item.label}
            </span>

            {/* Active underline */}
            {isActive && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 bottom-1.5 h-[2px] rounded-full bg-neon/90 shadow-[0_0_10px_var(--neon)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
