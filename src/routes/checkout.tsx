import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { getLoadout, loadoutTotals, clearLoadout } from "@/lib/loadout";
import {
  createOrder,
  getPlayerStats,
  updatePlayerProfileInfo,
} from "@/lib/bunker-supabase";
import { getGameSettings, getPaymentQRs } from "@/lib/sheets.functions";
import { cn } from "@/lib/utils";
import { CreditCard, MapPin, Package, Phone, User } from "lucide-react";
import { toast } from "sonner";

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

function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(getLoadout);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const statsQ = useQuery({ queryKey: ["player_stats"], queryFn: getPlayerStats });
  const stats: any = statsQ.data;

  const fetchQRs = useServerFn(getPaymentQRs);
  const fetchSettings = useServerFn(getGameSettings);
  const qrQ = useQuery({ queryKey: ["payment_qrs"], queryFn: fetchQRs, staleTime: 60_000 });
  const settingsQ = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings, staleTime: 60_000 });

  const paymentOptions = useMemo<Payment[]>(() => {
    const fromSheet = (qrQ.data ?? []).map((q) => q.method as Payment);
    return fromSheet.length ? fromSheet : ["PromptPay", "KPay", "WavePay"];
  }, [qrQ.data]);

  const selectedQR = qrQ.data?.find((q) => q.method === payment) ?? null;

  useEffect(() => setItems(getLoadout()), []);

  // Autofill from profile when it loads (only if inputs are still empty).
  useEffect(() => {
    if (!stats) return;
    setName((v) => (v ? v : stats.full_name ?? ""));
    setPhone((v) => (v ? v : stats.phone ?? ""));
    setAddress((v) => (v ? v : stats.default_address ?? ""));
  }, [stats?.player_key]);

  const minAmount = settingsQ.data?.minimum_order_amount ?? 0;
  const minWeight = settingsQ.data?.minimum_order_weight ?? 0;
  const settingsReady = minAmount > 0 && minWeight > 0;
  const { enriched, productTotal, totalGrams, minMet } = loadoutTotals(items, {
    amount: minAmount,
    weight: minWeight,
  });


  const canSubmit =
    settingsReady && minMet && payment && name.trim() && phone.trim() && address.trim() && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit || !payment) return;
    setSubmitting(true);
    try {
      const { order, missionRewards } = await createOrder({
        items,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim() || undefined,
        },
        payment,
        productTotal,
        totalGrams,
      });
      if (saveAsDefault) {
        try {
          await updatePlayerProfileInfo({
            fullName: name.trim(),
            phone: phone.trim(),
            defaultAddress: address.trim(),
          });
        } catch (e) {
          console.warn("[BLACK'S BUNKER] Could not save default profile info", e);
        }
      }
      clearLoadout();
      if (missionRewards.length) {
        toast.success(`MISSION COMPLETE — ${missionRewards.map((m) => m.title).join(", ")}`);
      }
      navigate({ to: "/order-complete", search: { id: order.mission_number } });
    } catch (err: any) {
      console.error("[BLACK'S BUNKER] Order transmission failed:", err);
      toast.error(err?.message || err?.details || "ORDER TRANSMISSION FAILED");
      setSubmitting(false);
    }
  };

  return (
    <AppShell hideLogo hideNav>
      <div className="grid h-full w-full grid-cols-[1fr_340px] gap-4 animate-in fade-in duration-500">
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
          <Panel variant="default" corners className="corner-frame-lines p-4">
            <SectionTitle>Delivery Information</SectionTitle>
            <div className="mt-3 grid grid-cols-2 gap-3">
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
                  label="Delivery Address"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="DROP LOCATION"
                />
              </div>
              <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-sm border border-white/10 bg-background/40 px-3 py-2 hover:border-neon/40">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="h-3.5 w-3.5 accent-neon"
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Save as my default delivery information
                </span>
              </label>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  Optional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ADDITIONAL INSTRUCTIONS..."
                  className="rounded-none border border-white/10 bg-background/60 px-3 py-2 font-mono text-sm tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:border-neon/70 focus:outline-none"
                />
              </div>
            </div>
          </Panel>

          <Panel variant="default" className="p-4">
            <SectionTitle>Payment Method</SectionTitle>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {paymentOptions.map((p) => {
                const active = payment === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPayment(p)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-sm border py-3 transition-all duration-200",
                      active
                        ? "border-neon bg-neon/10 text-neon shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                        : "border-white/10 bg-background/40 text-muted-foreground hover:border-neon/40 hover:text-foreground",
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
            {selectedQR?.qrImage && (
              <div className="mt-3 flex flex-col items-center gap-2 rounded-sm border border-white/10 bg-background/40 p-3">
                <img
                  src={selectedQR.qrImage}
                  alt={`${payment} QR`}
                  className="h-40 w-40 rounded-sm object-contain"
                />
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  Scan to pay · {payment}
                </div>
              </div>
            )}

          </Panel>
        </div>

        <Panel variant="elevated" corners className="corner-frame-lines flex flex-col p-4">
          <div className="mb-3 border-b border-white/10 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              // Order Summary
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {enriched.map((i) => (
              <div
                key={`${i.productId}-${i.sizeLabel}`}
                className="flex items-center gap-2 rounded-sm border border-white/10 bg-background/40 p-2"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-hud">
                  {i.productImage ? (
                    <img src={i.productImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-neon/70" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[11px] font-bold uppercase tracking-wider">
                    {i.productName ?? i.productId}
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

          <div className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-3 text-xs">
            <SummaryRow label="Total Weight" value={`${totalGrams} G`} />
            <SummaryRow label="Product Total" value={`฿${productTotal.toLocaleString()}`} />
            <SummaryRow label="Delivery Fee" value="TO BE CONFIRMED" muted />
            <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
            className="mt-4 w-full"
          >
            {submitting ? "Transmitting..." : "Deploy Mission"}
          </BunkerButton>
        </Panel>
      </div>
    </AppShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
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
