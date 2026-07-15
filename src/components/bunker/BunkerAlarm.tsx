import { useEffect, useState } from "react";
import { AlertTriangle, Package, Radio, Bell, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { listPlayerNotifications, markNotificationRead, type PlayerNotificationRow } from "@/lib/bunker-supabase";
import { getAnnouncements, getGameSettings } from "@/lib/sheets.functions";

type AlarmTone = "intel" | "supply" | "reward" | "warn" | "ops";

interface AlarmItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  source: "notification" | "announcement";
  orderId?: string | null;
}

function toneFor(type: string): AlarmTone {
  const t = type.toUpperCase();
  if (t.includes("ORDER") || t === "SUPPLY") return "supply";
  if (t === "REWARD" || t === "NEWS") return "reward";
  if (t === "WARN" || t === "ALERT" || t === "SYSTEM") return "warn";
  if (t === "OPS") return "ops";
  return "intel";
}

function iconFor(type: string) {
  const t = type.toUpperCase();
  if (t.includes("ORDER") || t === "SUPPLY") return Package;
  if (t === "WARN" || t === "ALERT" || t === "SYSTEM") return AlertTriangle;
  if (t === "REWARD") return Trophy;
  if (t === "NEWS") return Bell;
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

function routeFor(item: AlarmItem): string | null {
  const t = item.type.toUpperCase();
  if (t.includes("ORDER")) return "/mission-log";
  if (t === "REWARD") return "/rewards";
  if (t === "MISSION") return "/missions";
  if (t === "RANK") return "/rank";
  return null;
}

export function BunkerAlarm() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<PlayerNotificationRow[]>([]);

  const fetchAnnouncements = useServerFn(getAnnouncements);
  const fetchSettings = useServerFn(getGameSettings);
  const annQ = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements, staleTime: 60_000 });
  const settingsQ = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings, staleTime: 60_000 });

  // Messages expire after 3 days
  const expireDays = settingsQ.data?.bunker_alarm_expire_days ?? 3;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listPlayerNotifications();
        if (!cancelled) setNotifs(rows);
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

  const now = Date.now();
  const cutoff = now - expireDays * 86_400_000;
  const allItems: AlarmItem[] = [
    ...notifs
      .filter((n) => new Date(n.created_at).getTime() >= cutoff)
      .map<AlarmItem>((n) => ({
        id: `n-${n.id}`,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
        isRead: n.is_read,
        source: "notification",
        orderId: n.order_id,
      })),
    ...(annQ.data ?? [])
      .filter((a) => {
        const t = a.createdAt ? new Date(a.createdAt).getTime() : now;
        return t >= cutoff;
      })
      .map<AlarmItem>((a, i) => ({
        id: `a-${i}-${a.title}`,
        type: a.type || "intel",
        title: a.title || "BUNKER TRANSMISSION",
        message: a.message,
        createdAt: a.createdAt || new Date().toISOString(),
        isRead: true,
        source: "announcement",
      })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function markRead(rawId: string) {
    try {
      await markNotificationRead(rawId);
      setNotifs((prev) => prev.map((x) => (x.id === rawId ? { ...x, is_read: true } : x)));
    } catch {
      /* ignore */
    }
  }

  async function handleClick(n: AlarmItem) {
    if (n.source === "notification" && !n.isRead) {
      void markRead(n.id.replace(/^n-/, ""));
    }
    const route = routeFor(n);
    if (route) navigate({ to: route });
  }

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col rounded-md gunmetal-glass p-2.5 lphone:p-2">
      <div className="flex shrink-0 items-center justify-between px-1 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-neon animate-ping opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-neon shadow-[0_0_8px_var(--neon)]" />
          </span>
          <span className="font-display text-[11px] font-black uppercase tracking-[0.3em] text-foreground lphone:text-[10px]">
            Bunker Alarm
          </span>
        </div>
        <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground lphone:text-[7px]">
          {allItems.length} · 3D
        </span>
      </div>

      <div className="mx-1 h-px shrink-0 bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

      {/* Scrollable message list */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1 lphone:gap-1">
        {allItems.length === 0 && (
          <div className="rounded-sm border border-dashed border-white/10 bg-black/30 p-3 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            No transmissions
          </div>
        )}
        {allItems.map((a, i) => {
          const tone = toneFor(a.type);
          const Icon = iconFor(a.type);
          const styles = toneStyles[tone];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => void handleClick(a)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-sm border border-border/50 bg-panel/60 p-1.5 pl-2.5 text-left transition-colors hover:border-neon/40 hover:bg-panel-elevated/70 animate-notif-in",
                !a.isRead && "ring-1 ring-neon/20",
              )}
              style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
            >
              <span
                className={cn(
                  "absolute left-0 top-1 bottom-1 w-0.5 rounded-full",
                  tone === "intel" && "bg-neon shadow-[0_0_6px_var(--neon)]",
                  tone === "supply" && "bg-sky-400",
                  tone === "reward" && "bg-amber-400",
                  tone === "warn" && "bg-orange-400",
                  tone === "ops" && "bg-muted-foreground/60",
                )}
              />
              <div className="flex items-start gap-1.5">
                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border bg-background/40", styles.badge)}>
                  <Icon className={cn("h-3 w-3", styles.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("rounded-sm border px-1 py-[1px] font-mono text-[7px] font-bold uppercase tracking-widest", styles.badge)}>
                      {styles.label}
                    </span>
                    <span className="ml-auto font-mono text-[8px] tabular-nums text-muted-foreground">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-display text-[10px] font-bold uppercase tracking-wider text-foreground lphone:text-[9px]">
                    {a.title}
                  </div>
                  <div className="truncate text-[9px] text-muted-foreground lphone:text-[8px]">{a.message}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex shrink-0 items-center justify-between px-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
        <span className="text-neon/70">// LIVE</span>
        <span>Auto-clear 3D</span>
      </div>
    </div>
  );
}
