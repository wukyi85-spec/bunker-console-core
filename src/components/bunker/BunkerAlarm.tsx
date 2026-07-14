import { useEffect, useState } from "react";
import { AlertTriangle, Package, Radio, Bell, X, Trophy } from "lucide-react";
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
  const [mountedCount, setMountedCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const fetchAnnouncements = useServerFn(getAnnouncements);
  const fetchSettings = useServerFn(getGameSettings);
  const annQ = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements, staleTime: 60_000 });
  const settingsQ = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings, staleTime: 60_000 });

  const expireDays = settingsQ.data?.bunker_alarm_expire_days ?? 3;
  const maxDisplay = settingsQ.data?.max_alarm_display ?? 3;

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

  const visible = allItems.slice(0, maxDisplay);
  const hasMore = allItems.length > visible.length;

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
    if (route) {
      setShowAll(false);
      navigate({ to: route });
    }
  }

  return (
    <div className="relative flex w-full flex-col rounded-md gunmetal-glass p-3 max-sm:p-2">
      <div className="flex items-center justify-between px-1 pb-2 max-sm:pb-1.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-neon animate-ping opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-neon shadow-[0_0_8px_var(--neon)]" />
          </span>
          <span className="font-display text-xs font-black uppercase tracking-[0.32em] text-foreground max-sm:text-[10px]">
            Bunker Alarm
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground max-sm:text-[7px]">
          LATEST {visible.length}
        </span>
      </div>

      <div className="mx-1 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

      <div className="mt-2 flex flex-col gap-2 max-sm:gap-1.5">
        {visible.length === 0 && (
          <div className="rounded-sm border border-dashed border-white/10 bg-black/30 p-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground max-sm:p-2 max-sm:text-[8px]">
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
                "relative animate-notif-in overflow-hidden rounded-sm border border-border/50 bg-panel/60 p-2 pl-3 text-left transition-colors hover:border-neon/40 hover:bg-panel-elevated/70 max-sm:p-1.5 max-sm:pl-2",
                !a.isRead && "ring-1 ring-neon/20",
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className={cn(
                  "absolute left-0 top-1 bottom-1 w-0.5 rounded-full max-sm:top-0.5 max-sm:bottom-0.5",
                  tone === "intel" && "bg-neon shadow-[0_0_6px_var(--neon)]",
                  tone === "supply" && "bg-sky-400",
                  tone === "reward" && "bg-amber-400",
                  tone === "warn" && "bg-orange-400 animate-hud-pulse",
                  tone === "ops" && "bg-muted-foreground/60",
                )}
              />
              <div className="flex items-start gap-2 max-sm:gap-1.5">
                <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border bg-background/40 max-sm:h-4 max-sm:w-4", styles.badge)}>
                  <Icon className={cn("h-3.5 w-3.5 max-sm:h-3 max-sm:w-3", styles.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-sm border px-1 py-[1px] font-mono text-[8px] font-bold uppercase tracking-widest max-sm:px-0.5 max-sm:text-[6px]", styles.badge)}>
                      {styles.label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground max-sm:text-[7px]">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-display text-[12px] font-bold uppercase tracking-wider text-foreground max-sm:text-[10px]">
                    {a.title}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground max-sm:text-[9px]">{a.message}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between px-1 pt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground max-sm:text-[7px]">
        <span className="text-neon/70">// LIVE</span>
        {(hasMore || allItems.length > 0) && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-sm border border-neon/40 bg-neon/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-neon transition-all hover:bg-neon/15 hover:shadow-[0_0_10px_-2px_var(--neon)] max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[7px]"
          >
            SEE MORE
          </button>
        )}
        {!(hasMore || allItems.length > 0) && <span>Secure Channel</span>}
      </div>

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAll(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[85vh] w-[min(560px,92vw)] flex-col overflow-hidden rounded-md border border-neon/40 gunmetal-glass shadow-[0_40px_120px_-20px_var(--neon)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-neon" />
                <span className="font-display text-sm font-black uppercase tracking-[0.32em] text-foreground">
                  All Transmissions
                </span>
                <span className="rounded-sm border border-neon/40 bg-neon/10 px-1.5 py-[1px] font-mono text-[9px] font-bold text-neon">
                  {allItems.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="rounded-sm border border-white/10 bg-background/40 p-1 text-muted-foreground hover:text-neon"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto p-3">
              {allItems.length === 0 && (
                <div className="p-6 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  No transmissions in the last {expireDays} days
                </div>
              )}
              {allItems.map((a) => {
                const tone = toneFor(a.type);
                const Icon = iconFor(a.type);
                const styles = toneStyles[tone];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => void handleClick(a)}
                    className={cn(
                      "relative overflow-hidden rounded-sm border border-border/50 bg-panel/60 p-3 pl-4 text-left transition-colors hover:border-neon/50 hover:bg-panel-elevated/70",
                      !a.isRead && "ring-1 ring-neon/20",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-2 bottom-2 w-0.5 rounded-full",
                        tone === "intel" && "bg-neon shadow-[0_0_6px_var(--neon)]",
                        tone === "supply" && "bg-sky-400",
                        tone === "reward" && "bg-amber-400",
                        tone === "warn" && "bg-orange-400",
                        tone === "ops" && "bg-muted-foreground/60",
                      )}
                    />
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border bg-background/40", styles.badge)}>
                        <Icon className={cn("h-4 w-4", styles.icon)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded-sm border px-1.5 py-[1px] font-mono text-[8px] font-bold uppercase tracking-widest", styles.badge)}>
                            {styles.label}
                          </span>
                          <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground">
                            {timeAgo(a.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1 font-display text-[13px] font-bold uppercase tracking-wider text-foreground">
                          {a.title}
                        </div>
                        <div className="text-[12px] text-muted-foreground">{a.message}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
