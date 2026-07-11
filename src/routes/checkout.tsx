import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { getLoadout, loadoutTotals, saveOrder, clearLoadout, type Order } from "@/lib/loadout";
import { cn } from "@/lib/utils";
import { CreditCard, MapPin, Package, Phone, User } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Payment = "PromptPay" | "KPay" | "WavePay";
const PAYMENTS: Payment[] = ["PromptPay", "KPay", "WavePay"];

function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(getLoadout);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setItems(getLoadout()), []);

  const { enriched, productTotal, totalGrams, minMet } = loadoutTotals(items);

  const canSubmit =
    minMet && payment && name.trim() && phone.trim() && address.trim() && !submitting;

  const handleConfirm = () => {
    if (!canSubmit || !payment) return;
    setSubmitting(true);
    const order: Order = {
      id: `OP-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      items,
      customer: { name: name.trim(), phone: phone.trim(), address: address.trim(), notes: notes.trim() || undefined },
      payment,
      productTotal,
      totalGrams,
    };
    saveOrder(order);
    clearLoadout();
    setTimeout(() => {
      navigate({ to: "/order-complete", search: { id: order.id } });
    }, 700);
  };

  return (
    <AppShell>
      <div className="grid h-full w-full grid-cols-[1fr_320px] gap-3 animate-in fade-in duration-500">
        {/* LEFT — Form */}
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
          <Panel variant="default" corners className="corner-frame-lines p-3">
            <SectionTitle>Delivery Information</SectionTitle>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <BunkerInput
                label="Customer Name"
                icon={<User className="h-3.5 w-3.5" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="OPERATOR NAME"
              />
              <BunkerInput
                label="Phone Number"
                icon={<Phone className="h-3.5 w-3.5" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+66 ..."
                inputMode="tel"
              />
              <div className="col-span-2">
                <BunkerInput
                  label="Address"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="DROP LOCATION"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ADDITIONAL INSTRUCTIONS..."
                  className="rounded-none border border-border/60 bg-background/60 px-3 py-2 font-mono text-sm tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:border-neon/70 focus:outline-none focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--neon)_35%,transparent)]"
                />
              </div>
            </div>
          </Panel>

          <Panel variant="default" className="p-3">
            <SectionTitle>Payment Method</SectionTitle>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PAYMENTS.map((p) => {
                const active = payment === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPayment(p)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-sm border py-3 transition-all duration-200",
                      active
                        ? "border-neon bg-neon/10 text-neon shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-neon/40 hover:text-foreground",
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="font-display text-xs font-bold uppercase tracking-widest">
                      {p}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* RIGHT — Order summary */}
        <Panel variant="elevated" corners className="corner-frame-lines flex flex-col p-3">
          <div className="mb-2 border-b border-border/60 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              // Order Summary
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {enriched.map((i) => (
              <div
                key={`${i.productId}-${i.sizeLabel}`}
                className="flex items-center gap-2 rounded-sm border border-border/50 bg-background/40 p-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border/60 bg-hud">
                  <Package className="h-3.5 w-3.5 text-neon/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[11px] font-bold uppercase tracking-wider">
                    {i.product?.name ?? i.productId}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    {i.sizeLabel} · x{i.quantity}
                  </div>
                </div>
                <div className="font-display text-[11px] font-bold text-neon">
                  ฿{i.subtotal.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-col gap-1.5 border-t border-border/60 pt-2 text-xs">
            <SummaryRow label="Total Weight" value={`${totalGrams} G`} />
            <SummaryRow label="Product Total" value={`฿${productTotal.toLocaleString()}`} />
            <SummaryRow label="Delivery Fee" value="TO BE CONFIRMED" muted />
            <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Grand Total
              </span>
              <span className="font-display text-lg font-bold text-neon">
                ฿{productTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <BunkerButton
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            onClick={handleConfirm}
            className="mt-3 w-full"
          >
            {submitting ? "Transmitting..." : "Confirm Order"}
          </BunkerButton>
        </Panel>
      </div>
    </AppShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 pb-2">
      <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
      <span className="font-display text-xs font-bold uppercase tracking-widest">{children}</span>
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-xs font-bold",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
