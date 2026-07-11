import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Package, Backpack, ScrollText, Settings } from "lucide-react";
import type { ComponentType } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
}

const items: NavItem[] = [
  { to: "/dashboard", label: "Lobby", icon: Home },
  { to: "/supply", label: "Arsenal", icon: Package, match: (p) => p.startsWith("/supply") },
  { to: "/loadout", label: "Loadout", icon: Backpack },
  { to: "/dashboard", label: "Missions", icon: ScrollText, match: () => false },
  { to: "/dashboard", label: "Settings", icon: Settings, match: () => false },
];

export function GameNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex items-center gap-1 rounded-md border border-border/60 bg-panel/95 p-1 shadow-[var(--shadow-hud)] backdrop-blur">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = item.match ? item.match(pathname) : pathname === item.to;
        return (
          <Link
            key={i}
            to={item.to}
            className={cn(
              "group relative flex items-center gap-2 rounded-sm px-3 py-2 transition-all duration-200",
              isActive
                ? "bg-panel-elevated text-neon"
                : "text-muted-foreground hover:text-foreground hover:bg-panel-elevated/50",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-display text-xs font-semibold uppercase tracking-widest">
              {item.label}
            </span>
            {isActive && <span className="absolute inset-x-2 -bottom-px h-px bg-neon" />}
          </Link>
        );
      })}
    </nav>
  );
}
