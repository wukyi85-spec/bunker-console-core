import { cn } from "@/lib/utils";
import { Home, Package, Users, Radio, Settings } from "lucide-react";
import { useState, type ComponentType } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const items: NavItem[] = [
  { id: "lobby", label: "Lobby", icon: Home },
  { id: "arsenal", label: "Arsenal", icon: Package },
  { id: "crew", label: "Crew", icon: Users },
  { id: "comms", label: "Comms", icon: Radio },
  { id: "settings", label: "Settings", icon: Settings },
];

export function GameNav() {
  const [active, setActive] = useState("lobby");
  return (
    <nav className="flex items-center gap-1 rounded-md border border-border/60 bg-panel/95 p-1 shadow-[var(--shadow-hud)] backdrop-blur">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
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
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-px bg-neon" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
