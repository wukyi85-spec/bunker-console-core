import { Link } from "@tanstack/react-router";
import { Users, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
  active: "members" | "orders";
}

export function AdminTabs({ active }: AdminTabsProps) {
  return (
    <nav className="flex items-center gap-1 rounded-md border border-white/10 bg-black/40 p-1">
      <Link
        to="/admin/members"
        className={cn(
          "flex items-center gap-2 rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] transition-colors",
          active === "members"
            ? "bg-neon/15 text-neon"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Users className="h-3.5 w-3.5" />
        Members
      </Link>
      <Link
        to="/admin/orders"
        className={cn(
          "flex items-center gap-2 rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] transition-colors",
          active === "orders"
            ? "bg-neon/15 text-neon"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <PackageOpen className="h-3.5 w-3.5" />
        Orders
      </Link>
    </nav>
  );
}
