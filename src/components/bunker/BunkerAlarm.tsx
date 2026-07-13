import { useEffect, useState } from "react";
import { AlertTriangle, Package, Radio, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { listPlayerNotifications, markNotificationRead, type PlayerNotificationRow } from "@/lib/bunker-supabase";

type AlarmTone = "intel" | "supply" | "reward" | "warn" | "ops";

function toneFor(type: string): AlarmTone {
  const t = type.toUpperCase();
  if (t === "ORDER" || t === "SUPPLY") return "supply";
  if (t === "REWARD") return "reward";
  if (t === "WARN" || t === "ALERT") return "warn";
  if (t === "OPS") return "ops";
  return "intel";
}

function iconFor(type: string) {
  const t = type.toUpperCase();
  if (t === "ORDER" || t === "SUPPLY") return Package;
  if (t === "WARN" || t === "ALERT") return AlertTriangle;
  if (t === "REWARD") return Bell;
  return Radio;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "NOW";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const toneStyles: Record<AlarmTone, { badge: string; label: string; icon: string }> = {
  intel:  { badge: "border-neon/50 bg-neon/10 text-neon",                       label: "INTEL",  icon: "text-neon" },
  supply: { badge: "border-sky-400/50 bg-sky-400/10 text-sky-300",              label: "SUPPLY", icon: "text-sky-300" },
  reward: { badge: "border-amber-400/50 bg-amber-400/10 text-amber-300",        label: "REWARD", icon: "text-amber-300" },
  warn:   { badge: "border-orange-400/60 bg-orange-500/10 text-orange-300",     label: "ALERT",  icon: "text-orange-300" },
  ops:    { badge: "border-border bg-panel-elevated text-muted-foreground",     label: "OPS",    icon: "text-muted-foreground" },
};

export function BunkerAlarm() {
  const [items, setItems] = useState<PlayerNotificationRow[]>([]);
  const [mountedCount, setMountedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listPlayerNotifications();
        if (!cancelled) setItems(rows.slice(0, 3));
      } catch {
        /* silent */
      }
    }
    void load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const visible = items;

  useEffect(() => {
    let i = 0;
    setMountedCount(0);
    const t = setInterval(() => {
      i += 1;
      setMountedCount(i);
      if (i >= visible.length) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, [visible.length]);

  async function handleClick(n: PlayerNotificationRow) {
    if (n.is_read) return;
    try {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative flex w-full flex-col rounded-md gunmetal-glass p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-neon animate-ping opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-neon shadow-[0_0_8px_var(--neon)]" />
          </span>
          <span className="font-display text-xs font-black uppercase tracking-[0.32em] text-foreground">
            Bunker Alarm
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {expanded ? `${items.length} TOTAL` : `LATEST ${visible.length}`}
        </span>
      </div>

      <div className="mx-1 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

      <div className={cn("mt-2 flex flex-col gap-2", expanded && "max-h-[260px] overflow-y-auto pr-1")}>
        {visible.length === 0 && (
          <div className="rounded-sm border border-dashed border-white/10 bg-black/30 p-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            No transmissions
          </div>
        )}
        {visible.slice(0, mountedCount).map((a, i) => {
          const tone = toneFor(a.type);
          const Icon = iconFor(a.type);
          const styles = toneStyles[tone];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => void handleClick(a)}
              className={cn(
                "relative animate-notif-in overflow-hidden rounded-sm border border-border/50 bg-panel/60 p-2 pl-3 text-left transition-colors hover:border-neon/40 hover:bg-panel-elevated/70",
                !a.is_read && "ring-1 ring-neon/20",
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className={cn(
                  "absolute left-0 top-1 bottom-1 w-0.5 rounded-full",
                  tone === "intel" && "bg-neon shadow-[0_0_6px_var(--neon)]",
                  tone === "supply" && "bg-sky-400",
                  tone === "reward" && "bg-amber-400",
                  tone === "warn" && "bg-orange-400 animate-hud-pulse",
                  tone === "ops" && "bg-muted-foreground/60",
                )}
              />
              <div className="flex items-start gap-2">
                <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border bg-background/40", styles.badge)}>
                  <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-sm border px-1 py-[1px] font-mono text-[8px] font-bold uppercase tracking-widest", styles.badge)}>
                      {styles.label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground">
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-display text-[12px] font-bold uppercase tracking-wider text-foreground">
                    {a.title}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.message}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {items.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group/va relative mt-2.5 flex items-center justify-center gap-2 overflow-hidden rounded-sm border border-neon/30 bg-panel/50 py-1.5 font-display text-[10px] font-black uppercase tracking-[0.32em] text-neon/90 transition-all hover:border-neon/70 hover:bg-neon/10 hover:text-neon hover:shadow-[0_0_16px_-4px_var(--neon)] active:scale-[0.98]"
        >
          {expanded ? "Show Less" : "View All"}
          <span aria-hidden className="text-neon">›</span>
        </button>
      )}

      <div className="mt-2 flex items-center justify-between px-1 pt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
        <span className="text-neon/70">// LIVE</span>
        <span>Secure Channel</span>
      </div>
    </div>
  );
}
