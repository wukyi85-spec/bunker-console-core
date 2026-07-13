import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { listOrders, orderStatusLabel } from "@/lib/bunker-supabase";
import type { LoadoutItem } from "@/lib/loadout";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Package,
  ExternalLink,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mission-log")({
  head: () => ({
    meta: [
      { title: "Order Details — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetailsPage,
});

type TabKey = "pending" | "out_for_delivery" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
];

function bucketOf(status: string): TabKey {
  const s = (status || "").toLowerCase();
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  if (["completed"].includes(s)) return "completed";
  if (["out_for_delivery", "delivered", "shipped", "in_transit"].includes(s)) return "out_for_delivery";
  return "pending"; // waiting_payment, pending, confirmed, processing, packing
}


function OrderDetailsPage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { pending: 0, out_for_delivery: 0, completed: 0, cancelled: 0 };
    for (const o of orders) c[bucketOf(o.status)]++;
    return c;
  }, [orders]);


  const filtered = useMemo(
    () => orders.filter((o) => bucketOf(o.status) === tab),
    [orders, tab],
  );

  return (
    <AppShell>
      <div className="flex h-full w-full flex-col gap-3 animate-in fade-in duration-500">
        {/* Tab bar */}
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-panel-elevated/50 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "group flex flex-1 items-center justify-center gap-2 rounded-sm px-3 py-2 transition-all",
                  active
                    ? "border border-neon/50 bg-neon/10 text-neon shadow-[0_0_18px_-6px_var(--neon)]"
                    : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-display text-[11px] font-bold uppercase tracking-widest">
                  {t.label}
                </span>
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-[1px] font-mono text-[9px] tabular-nums",
                    active
                      ? "bg-neon/20 text-neon"
                      : "bg-white/10 text-muted-foreground",
                  )}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <Panel variant="default" className="flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <ClipboardList className="h-4 w-4 text-neon" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Order Details
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-10 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Loading transmissions...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <div className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  No orders in this category
                </div>
              </div>
            ) : (
              filtered.map((o) => <OrderRow key={o.id} order={o as OrderRow} />)
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
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
  delivery_fee?: number | null;
  status: string;
  xp_earned: number | null;
  gold_earned: number | null;
  cancellation_reason?: string | null;
  tracking_url?: string | null;
}

function OrderRow({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(order.items) ? (order.items as LoadoutItem[]) : [];
  const date = new Date(order.created_at);
  const bucket = bucketOf(order.status);

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
        <StatusPill status={order.status} />
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {order.status?.toLowerCase() === "cancelled" && order.cancellation_reason && (
            <div className="mb-3 rounded-sm border border-red-500/40 bg-red-500/5 p-3">
              <div className="font-mono text-[9px] uppercase tracking-widest text-red-400/80">
                Cancellation Reason
              </div>
              <div className="mt-1 text-[12px] text-foreground">{order.cancellation_reason}</div>
            </div>
          )}

          {/* Tracking */}
          {bucket === "out_for_delivery" || bucket === "completed" ? (
            <div className="mb-3 rounded-sm border border-white/10 bg-background/40 p-3">
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-neon" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  Tracking
                </span>
              </div>
              {order.tracking_url ? (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-neon/50 bg-neon/10 px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-[0.3em] text-neon shadow-[0_0_18px_-6px_var(--neon)] transition-colors hover:bg-neon/20"
                >
                  <ExternalLink className="h-3 w-3" />
                  Track Order
                </a>
              ) : (
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  Tracking information is not available yet. Please check again after your order is handed to delivery.
                </div>
              )}
            </div>
          ) : null}


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
              <Detail
                label="Product Total"
                value={`฿${Number(order.product_total).toLocaleString()}`}
              />
              <Detail
                label="Delivery Fee"
                value={
                  order.delivery_fee != null
                    ? `฿${Number(order.delivery_fee).toLocaleString()}`
                    : "TO BE CONFIRMED"
                }
              />
              <Detail
                label="Grand Total"
                value={`฿${Number(order.grand_total).toLocaleString()}`}
                accent
              />
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

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
        s === "waiting_payment" || s === "pending"
          ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
          : s === "confirmed" || s === "processing" || s === "packing"
            ? "border-neon/60 bg-neon/10 text-neon"
            : s === "out_for_delivery" || s === "delivered"
              ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
              : s === "completed"
                ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                : s === "cancelled"
                  ? "border-red-500/60 bg-red-500/10 text-red-300"
                  : "border-white/20 bg-background/40 text-muted-foreground",
      )}
    >
      {orderStatusLabel(status)}
    </span>
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
