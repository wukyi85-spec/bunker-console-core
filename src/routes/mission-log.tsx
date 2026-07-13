import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { listOrders, orderStatusLabel } from "@/lib/bunker-supabase";
import type { LoadoutItem } from "@/lib/loadout";
import { ChevronDown, ChevronRight, ClipboardList, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mission-log")({
  head: () => ({
    meta: [
      { title: "Mission Log — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MissionLogPage,
});

function MissionLogPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  const totalMissions = orders.length;
  const totalSpent = orders.reduce((s, o) => s + Number(o.grand_total ?? 0), 0);
  const totalGrams = orders.reduce((s, o) => s + Number(o.total_grams ?? 0), 0);
  const totalXP = orders.reduce((s, o) => s + (o.xp_earned ?? 0), 0);

  return (
    <AppShell>
      <div className="flex h-full w-full flex-col gap-3 animate-in fade-in duration-500">
        {/* Top stats bar */}
        <div className="grid grid-cols-4 gap-3">
          <StatTile label="Missions" value={String(totalMissions)} />
          <StatTile label="Total Spent" value={`฿${totalSpent.toLocaleString()}`} />
          <StatTile label="Total Weight" value={`${totalGrams}G`} />
          <StatTile label="XP Earned" value={totalXP.toLocaleString()} accent />
        </div>

        <Panel variant="default" className="flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <ClipboardList className="h-4 w-4 text-neon" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Mission History
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-10 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Loading transmissions...
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <div className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  No Missions Yet
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  Deploy your first mission from the Supply Room
                </p>
              </div>
            ) : (
              orders.map((o) => <MissionRow key={o.id} order={o} />)
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-white/10 bg-panel-elevated/60 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-2xl font-bold",
          accent ? "text-neon" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

interface OrderRow {
  id: string;
  mission_number: string;
  created_at: string;
  items: unknown;
  customer_name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  payment_method: string;
  total_grams: number;
  product_total: number;
  grand_total: number;
  status: string;
  xp_earned: number | null;
  gold_earned: number | null;
  cancellation_reason?: string | null;
}

function MissionRow({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(order.items) ? (order.items as LoadoutItem[]) : [];
  const date = new Date(order.created_at);

  return (
    <div className="rounded-md border border-white/10 bg-panel-elevated/40 transition-all">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-neon" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <div className="flex-1">
          <div className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
            {order.mission_number}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {date.toLocaleString()} · {order.payment_method}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            {order.total_grams}G · {items.length} ITEMS
          </div>
          <div className="font-display text-sm font-bold text-neon">
            ฿{Number(order.grand_total).toLocaleString()}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
            order.status?.toLowerCase() === "waiting_payment" || order.status?.toLowerCase() === "pending"
              ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
              : order.status?.toLowerCase() === "confirmed"
              ? "border-neon/60 bg-neon/10 text-neon"
              : order.status?.toLowerCase() === "delivered" || order.status?.toLowerCase() === "completed"
              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
              : "border-white/20 bg-background/40 text-muted-foreground",
          )}
        >
          {orderStatusLabel(order.status)}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-[1fr_240px] gap-4">
            <div className="flex flex-col gap-1.5">
              {items.map((i, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-sm border border-white/10 bg-background/40 p-2"
                >
                  <Package className="h-3.5 w-3.5 text-neon/60" />
                  <div className="flex-1">
                    <div className="font-display text-[11px] font-bold uppercase tracking-wider">
                      {i.productName}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {i.sizeLabel} · x{i.quantity} · {i.grams * i.quantity}G
                    </div>
                  </div>
                  <div className="font-display text-[11px] font-bold text-neon">
                    ฿{(i.grams * i.quantity * i.pricePerGram).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <Detail label="Customer" value={order.customer_name ?? "—"} />
              <Detail label="Phone" value={order.phone ?? "—"} />
              <Detail label="Address" value={order.address ?? "—"} />
              {order.notes && <Detail label="Notes" value={order.notes} />}
              <div className="my-1 h-px bg-white/10" />
              <Detail label="XP Earned" value={`+${order.xp_earned ?? 0}`} accent />
              <Detail label="Gold Earned" value={`+${order.gold_earned ?? 0}`} accent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-[11px] font-bold uppercase tracking-wider",
          accent ? "text-neon" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
