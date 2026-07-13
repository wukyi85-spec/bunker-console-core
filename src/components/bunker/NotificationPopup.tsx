import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import {
  listPlayerNotifications,
  markNotificationRead,
  type PlayerNotificationRow,
} from "@/lib/bunker-supabase";
import { cn } from "@/lib/utils";

const POPUP_TYPES = new Set(["ORDER", "ORDER_CANCELLED"]);

export function NotificationPopup() {
  const [queue, setQueue] = useState<PlayerNotificationRow[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listPlayerNotifications();
        if (cancelled) return;
        const pending = rows.filter(
          (r) => !r.is_read && POPUP_TYPES.has(r.type.toUpperCase()) && !seen.has(r.id),
        );
        if (pending.length) {
          setQueue((q) => {
            const ids = new Set(q.map((x) => x.id));
            return [...q, ...pending.filter((p) => !ids.has(p.id))];
          });
        }
      } catch {
        /* ignore */
      }
    }
    void load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = queue[0];
  if (!current) return null;

  const cancelled = current.type.toUpperCase() === "ORDER_CANCELLED";

  async function handleClose() {
    const n = current;
    setSeen((s) => new Set(s).add(n.id));
    setQueue((q) => q.slice(1));
    try {
      await markNotificationRead(n.id);
    } catch {
      /* ignore */
    }
  }

  // Extract reason from message if cancelled
  const reasonMatch = cancelled ? current.message.match(/Reason:\s*(.+)$/) : null;
  const reason = reasonMatch ? reasonMatch[1] : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className={cn(
          "relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-md border-2 p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300",
          cancelled
            ? "border-red-500/60 bg-panel"
            : "border-neon/60 bg-panel",
        )}
      >
        <button
          onClick={() => void handleClose()}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            cancelled
              ? "bg-[radial-gradient(circle_at_center,rgb(239_68_68/0.18)_0%,transparent_65%)]"
              : "bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_22%,transparent)_0%,transparent_65%)]",
          )}
        />

        <div className="relative mb-4">
          <span
            className={cn(
              "absolute inset-0 rounded-full blur-2xl animate-hud-pulse",
              cancelled ? "bg-red-500/30" : "bg-neon/30",
            )}
          />
          <div
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full border-2 bg-background",
              cancelled ? "border-red-500" : "border-neon",
            )}
          >
            {cancelled ? (
              <XCircle className="h-10 w-10 text-red-500" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-neon" />
            )}
          </div>
        </div>

        <div
          className={cn(
            "relative font-mono text-[10px] uppercase tracking-[0.5em]",
            cancelled ? "text-red-400" : "text-neon",
          )}
        >
          // Transmission
        </div>
        <h1 className="relative mt-2 font-display text-3xl font-black uppercase tracking-widest text-foreground">
          {cancelled ? "Order Cancelled" : "Order Confirmed"}
        </h1>

        {current.order_id && (
          <div className="relative mt-3 rounded-sm border border-white/10 bg-background/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Mission · <span className="text-foreground">{current.order_id}</span>
          </div>
        )}

        {cancelled && reason ? (
          <div className="relative mt-4 w-full rounded-sm border border-red-500/30 bg-red-500/5 px-4 py-3 text-left">
            <div className="font-mono text-[9px] uppercase tracking-widest text-red-400/80">
              Reason
            </div>
            <div className="mt-1 text-sm text-foreground">{reason}</div>
          </div>
        ) : (
          <p className="relative mt-3 max-w-sm text-sm text-muted-foreground">
            {cancelled
              ? current.message
              : "Your mission has been confirmed by BLACK'S BUNKER. Stand by for supply."}
          </p>
        )}

        <button
          onClick={() => void handleClose()}
          className={cn(
            "relative mt-6 rounded-sm border px-6 py-2 font-display text-xs font-bold uppercase tracking-[0.3em] transition-all",
            cancelled
              ? "border-red-500/60 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              : "border-neon/60 bg-neon/10 text-neon hover:bg-neon/20",
          )}
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
