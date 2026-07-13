import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  CheckCircle2,
  Package,
  Ban,
  Truck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/bunker/Logo";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { AdminTabs } from "@/components/bunker/AdminTabs";
import { getAdminSession, clearAdminSession } from "@/lib/admin-session";
import {
  adminListOrders,
  adminConfirmOrder,
  adminCancelOrder,
  adminSetOrderTracking,
  adminDeleteOrder,
  type AdminOrderRow,
} from "@/lib/admin";
import { orderStatusLabel } from "@/lib/bunker-supabase";
import type { LoadoutItem } from "@/lib/loadout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Admin — Orders" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrdersPage,
});

const STATUS_FILTERS = [
  "all",
  "waiting_payment",
  "confirmed",
  "processing",
  "packing",
  "delivered",
  "completed",
  "cancelled",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "waiting_payment" || s === "pending")
    return "bg-amber-500/15 text-amber-300 border-amber-400/40";
  if (s === "confirmed") return "bg-neon/15 text-neon border-neon/40";
  if (s === "processing") return "bg-sky-500/15 text-sky-300 border-sky-400/40";
  if (s === "packing") return "bg-indigo-500/15 text-indigo-300 border-indigo-400/40";
  if (s === "delivered") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/40";
  if (s === "completed") return "bg-emerald-600/20 text-emerald-200 border-emerald-500/40";
  if (s === "cancelled") return "bg-red-500/15 text-red-400 border-red-400/40";
  return "bg-white/8 text-muted-foreground border-white/10";
}

function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<AdminOrderRow | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminOrderRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const s = getAdminSession();
    if (!s) {
      navigate({ to: "/dashboard" });
      return;
    }
  }, [navigate]);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await adminListOrders();
      setOrders(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all") {
        const s = o.status.toLowerCase();
        if (filter === "waiting_payment" && !(s === "waiting_payment" || s === "pending"))
          return false;
        if (filter !== "waiting_payment" && s !== filter) return false;
      }
      if (!q) return true;
      return (
        o.mission_number.toLowerCase().includes(q) ||
        (o.pass_id ?? "").toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, filter]);

  async function handleConfirm(orderId: string) {
    setConfirming(orderId);
    try {
      await adminConfirmOrder(orderId);
      toast.success("Order confirmed");
      await refresh();
      if (selected?.id === orderId) {
        const next = orders.find((o) => o.id === orderId);
        if (next) setSelected({ ...next, status: "confirmed" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setConfirming(null);
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error("Cancellation reason is required");
      return;
    }
    setCancelling(true);
    try {
      await adminCancelOrder(cancelTarget.id, reason);
      toast.success("Order cancelled");
      const id = cancelTarget.id;
      setCancelTarget(null);
      setCancelReason("");
      await refresh();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }


  async function handleSetTracking(orderId: string, url: string) {
    try {
      await adminSetOrderTracking(orderId, url.trim());
      toast.success(url.trim() ? "Tracking link saved" : "Tracking link cleared");
      await refresh();
      if (selected?.id === orderId) {
        setSelected((prev) => (prev ? { ...prev, tracking_url: url.trim() || null } : prev));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save tracking link");
    }
  }

  async function handleDeleteOrder(orderId: string) {
    try {
      await adminDeleteOrder(orderId);
      toast.success("Order deleted");
      if (selected?.id === orderId) setSelected(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order");
    }
  }

  function handleLogout() {
    clearAdminSession();
    navigate({ to: "/login" });
  }

  const canConfirm = (o: AdminOrderRow) => {
    const s = o.status.toLowerCase();
    return s === "waiting_payment" || s === "pending";
  };
  const canCancel = (o: AdminOrderRow) => {
    const s = o.status.toLowerCase();
    return s !== "cancelled" && s !== "completed" && s !== "delivered";
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_78%)]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/8 bg-black/40 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden md:flex items-center gap-2 rounded-md border border-neon/40 bg-neon/5 px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-neon" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-neon">
              Admin Console
            </span>
          </div>
          <AdminTabs active="orders" />
        </div>
        <div className="flex items-center gap-2">
          <BunkerButton variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </BunkerButton>
          <BunkerButton variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </BunkerButton>
        </div>
      </header>

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-3">
        <div className="max-w-md flex-1">
          <BunkerInput
            name="search"
            placeholder="Search Order ID, Pass ID, Customer, Phone"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors",
                filter === f
                  ? "border-neon/60 bg-neon/10 text-neon"
                  : "border-white/10 bg-black/30 text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "ALL" : orderStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <main className="relative z-10 flex-1 overflow-hidden px-6 pb-6">
        <Panel className="flex h-full flex-col overflow-hidden">
          <div className="grid grid-cols-[1.4fr_0.9fr_1fr_1.1fr_1fr_0.6fr_0.8fr_0.9fr_1fr_1fr_1fr] gap-3 border-b border-white/8 bg-black/40 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Order ID</span>
            <span>Pass ID</span>
            <span>Player</span>
            <span>Customer</span>
            <span>Phone</span>
            <span>Weight</span>
            <span>Total</span>
            <span>Payment</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Loading orders…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                No orders match.
              </div>
            )}
            {!loading &&
              filtered.map((o) => (
                <div
                  key={o.id}
                  className="grid grid-cols-[1.4fr_0.9fr_1fr_1.1fr_1fr_0.6fr_0.8fr_0.9fr_1fr_1fr_1fr] cursor-pointer items-center gap-3 border-b border-white/5 px-4 py-2.5 text-sm text-foreground hover:bg-white/[0.02]"
                  onClick={() => setSelected(o)}
                >
                  <span className="truncate font-mono text-neon">{o.mission_number}</span>
                  <span className="truncate font-mono">{o.pass_id ?? "—"}</span>
                  <span className="truncate">{o.player_name ?? "—"}</span>
                  <span className="truncate">{o.customer_name}</span>
                  <span className="truncate font-mono text-xs">{o.phone}</span>
                  <span className="font-mono text-xs">{o.total_grams}G</span>
                  <span className="font-mono text-xs">฿{Number(o.product_total).toLocaleString()}</span>
                  <span className="truncate font-mono text-xs uppercase">{o.payment_method}</span>
                  <span>
                    <span
                      className={cn(
                        "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                        statusBadgeClass(o.status),
                      )}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </span>
                  <span className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {canConfirm(o) && (
                      <BunkerButton
                        size="sm"
                        onClick={() => void handleConfirm(o.id)}
                        disabled={confirming === o.id}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {confirming === o.id ? "…" : "Accept"}
                      </BunkerButton>
                    )}
                    {canCancel(o) && (
                      <button
                        onClick={() => {
                          setCancelReason("");
                          setCancelTarget(o);
                        }}
                        className="inline-flex items-center gap-1 rounded-sm border border-red-500/40 bg-red-500/10 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20"
                      >
                        <Ban className="h-3 w-3" />
                        Cancel
                      </button>
                    )}
                    {!canConfirm(o) && !canCancel(o) && (
                      <BunkerButton size="sm" variant="ghost" onClick={() => setSelected(o)}>
                        View
                      </BunkerButton>
                    )}
                  </span>
                </div>
              ))}
          </div>
        </Panel>
      </main>

      {selected && (
        <OrderDetailsDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onConfirm={() => void handleConfirm(selected.id)}
          onCancel={() => {
            setCancelReason("");
            setCancelTarget(selected);
          }}
          confirming={confirming === selected.id}
          canConfirm={canConfirm(selected)}
          canCancel={canCancel(selected)}
        />
      )}

      {cancelTarget && (
        <CancelOrderDialog
          order={cancelTarget}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          onClose={() => {
            if (!cancelling) {
              setCancelTarget(null);
              setCancelReason("");
            }
          }}
          onConfirm={() => void handleCancelConfirm()}
          submitting={cancelling}
        />
      )}
    </div>
  );
}

function OrderDetailsDrawer({
  order,
  onClose,
  onConfirm,
  onCancel,
  confirming,
  canConfirm,
  canCancel,
}: {
  order: AdminOrderRow;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  canConfirm: boolean;
  canCancel: boolean;
}) {
  const items = Array.isArray(order.items)
    ? (order.items as LoadoutItem[])
    : Array.isArray(order.order_items)
    ? (order.order_items as LoadoutItem[])
    : [];
  const productTotal = Number(order.product_total ?? 0);
  const grandTotal = Number(order.grand_total ?? productTotal);
  const deliveryFee = Math.max(0, grandTotal - productTotal);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative flex h-full w-[560px] max-w-[90vw] flex-col overflow-hidden border-l border-white/10 bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Order
            </div>
            <div className="font-display text-lg font-bold text-neon">{order.mission_number}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </span>
            <span
              className={cn(
                "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                statusBadgeClass(order.status),
              )}
            >
              {orderStatusLabel(order.status)}
            </span>
          </div>

          <Section title="Products">
            <div className="flex flex-col gap-2">
              {items.map((i, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-sm border border-white/10 bg-background/40 p-2"
                >
                  <Package className="h-4 w-4 text-neon/60" />
                  <div className="flex-1">
                    <div className="font-display text-xs font-bold uppercase tracking-wider">
                      {i.productName}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {i.sizeLabel} · x{i.quantity} · {i.grams * i.quantity}G
                    </div>
                  </div>
                  <div className="font-display text-xs font-bold text-neon">
                    ฿{(i.grams * i.quantity * i.pricePerGram).toLocaleString()}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  No item detail
                </div>
              )}
            </div>
          </Section>

          <Section title="Delivery">
            <Detail label="Customer" value={order.customer_name} />
            <Detail label="Phone" value={order.phone} />
            <Detail label="Address" value={order.address} />
            {order.notes && <Detail label="Notes" value={order.notes} />}
          </Section>

          <Section title="Payment">
            <Detail label="Method" value={order.payment_method} />
            <Detail label="Product Total" value={`฿${productTotal.toLocaleString()}`} />
            <Detail label="Delivery Fee" value={`฿${deliveryFee.toLocaleString()}`} />
            <Detail label="Grand Total" value={`฿${grandTotal.toLocaleString()}`} accent />
          </Section>

          <Section title="Meta">
            <Detail label="Pass ID" value={order.pass_id ?? "—"} />
            <Detail label="Player" value={order.player_name ?? "—"} />
            <Detail label="Total Weight" value={`${order.total_grams}G`} />
            <Detail label="Created" value={new Date(order.created_at).toLocaleString()} />
            {order.confirmed_at && (
              <Detail
                label="Confirmed"
                value={`${new Date(order.confirmed_at).toLocaleString()}${order.confirmed_by ? ` by ${order.confirmed_by}` : ""}`}
              />
            )}
            {order.cancelled_at && (
              <Detail
                label="Cancelled"
                value={`${new Date(order.cancelled_at).toLocaleString()}${order.cancelled_by ? ` by ${order.cancelled_by}` : ""}`}
              />
            )}
          </Section>

          {order.status.toLowerCase() === "cancelled" && order.cancellation_reason && (
            <Section title="Cancellation Reason">
              <div className="rounded-sm border border-red-500/30 bg-red-500/5 p-3 text-[12px] text-foreground">
                {order.cancellation_reason}
              </div>
            </Section>
          )}
        </div>

        {(canConfirm || canCancel) && (
          <div className="flex gap-2 border-t border-white/10 p-4">
            {canConfirm && (
              <BunkerButton className="flex-1" onClick={onConfirm} disabled={confirming}>
                <CheckCircle2 className="h-4 w-4" />
                {confirming ? "Confirming…" : "Accept Order"}
              </BunkerButton>
            )}
            {canCancel && (
              <button
                onClick={onCancel}
                disabled={confirming}
                className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-red-500/50 bg-red-500/10 px-3 py-2 font-display text-xs font-black uppercase tracking-[0.3em] text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Cancel Order
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-right font-display text-xs font-bold uppercase tracking-wider",
          accent ? "text-neon" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CancelOrderDialog({
  order,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  submitting,
}: {
  order: AdminOrderRow;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md rounded-md border-2 border-red-500/50 bg-panel p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/60 bg-red-500/10">
            <Ban className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-red-400">
              // Cancel Order
            </div>
            <div className="font-display text-lg font-black uppercase tracking-widest text-foreground">
              {order.mission_number}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Provide a cancellation reason. The member will receive a notification with this reason.
        </p>

        <label className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          disabled={submitting}
          placeholder="e.g. Out of stock. Please contact support."
          className="mt-1 w-full resize-none rounded-sm border border-white/15 bg-background/60 p-2 text-sm text-foreground outline-none transition-colors focus:border-red-500/60"
        />

        <div className="mt-5 flex gap-2">
          <BunkerButton
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Back
          </BunkerButton>
          <button
            onClick={onConfirm}
            disabled={submitting || reason.trim().length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-red-500/60 bg-red-500/15 px-3 py-2 font-display text-xs font-black uppercase tracking-[0.3em] text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-40"
          >
            <Ban className="h-4 w-4" />
            {submitting ? "Cancelling…" : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
