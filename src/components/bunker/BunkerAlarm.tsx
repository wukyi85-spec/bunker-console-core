import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Package,
  Sparkles,
  Trophy,
  Wrench,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type AlarmTone = "intel" | "supply" | "reward" | "warn" | "ops";

interface Alarm {
  id: string;
  tone: AlarmTone;
  title: string;
  detail: string;
  time: string;
  icon: ComponentType<{ className?: string }>;
}

const ALARMS: Alarm[] = [
  {
    id: "a1",
    tone: "intel",
    title: "Weekly Mission Updated",
    detail: "New objectives available in Mission Log",
    time: "NOW",
    icon: Radio,
  },
  {
    id: "a2",
    tone: "supply",
    title: "Supply Shipment Arrived",
    detail: "Crate 07-B unlocked · Arsenal",
    time: "12m",
    icon: Package,
  },
  {
    id: "a3",
    tone: "supply",
    title: "Blue Dream Restocked",
    detail: "Limited stock · check Supply Room",
    time: "38m",
    icon: Sparkles,
  },
  {
    id: "a4",
    tone: "warn",
    title: "Activity Drop Incoming",
    detail: "Activity will decrease tomorrow 00:00",
    time: "2h",
    icon: AlertTriangle,
  },
  {
    id: "a5",
    tone: "reward",
    title: "New Reward Available",
    detail: "Redeem 500G — Rank Crate III",
    time: "5h",
    icon: Trophy,
  },
  {
    id: "a6",
    tone: "ops",
    title: "Maintenance Notice",
    detail: "Bunker sync · Sun 04:00–04:20 UTC",
    time: "1d",
    icon: Wrench,
  },
];

const toneStyles: Record<AlarmTone, { badge: string; label: string; icon: string }> = {
  intel:  { badge: "border-neon/50 bg-neon/10 text-neon",           label: "INTEL",  icon: "text-neon" },
  supply: { badge: "border-sky-400/50 bg-sky-400/10 text-sky-300",  label: "SUPPLY", icon: "text-sky-300" },
  reward: { badge: "border-amber-400/50 bg-amber-400/10 text-amber-300", label: "REWARD", icon: "text-amber-300" },
  warn:   { badge: "border-orange-400/60 bg-orange-500/10 text-orange-300", label: "ALERT",  icon: "text-orange-300" },
  ops:    { badge: "border-border bg-panel-elevated text-muted-foreground", label: "OPS",    icon: "text-muted-foreground" },
};

export function BunkerAlarm() {
  const visible = ALARMS.slice(0, 3);
  const [mountedCount, setMountedCount] = useState(0);

  // Progressive reveal for the notification list — feels like intel dropping in.
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setMountedCount(i);
      if (i >= visible.length) clearInterval(t);
    }, 140);
    return () => clearInterval(t);
  }, [visible.length]);

  return (
    <div className="relative flex h-full w-full flex-col rounded-md glass-panel p-3">
      {/* Header */}
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
          {ALARMS.length} FEED
        </span>
      </div>

      <div className="mx-1 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

      {/* Feed */}
      <div className="mt-2 flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {ALARMS.slice(0, mountedCount).map((a, i) => {
          const Icon = a.icon;
          const styles = toneStyles[a.tone];
          return (
            <div
              key={a.id}
              className="relative animate-notif-in overflow-hidden rounded-sm border border-border/50 bg-panel/60 p-2 pl-3 transition-colors hover:border-neon/40 hover:bg-panel-elevated/70"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Left tone bar */}
              <span
                className={cn(
                  "absolute left-0 top-1 bottom-1 w-0.5 rounded-full",
                  a.tone === "intel" && "bg-neon shadow-[0_0_6px_var(--neon)]",
                  a.tone === "supply" && "bg-sky-400",
                  a.tone === "reward" && "bg-amber-400",
                  a.tone === "warn" && "bg-orange-400 animate-hud-pulse",
                  a.tone === "ops" && "bg-muted-foreground/60",
                )}
              />

              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border bg-background/40",
                    styles.badge,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-sm border px-1 py-[1px] font-mono text-[8px] font-bold uppercase tracking-widest",
                        styles.badge,
                      )}
                    >
                      {styles.label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground">
                      {a.time}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-display text-[12px] font-bold uppercase tracking-wider text-foreground">
                    {a.title}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {a.detail}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between px-1 pt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
        <span className="text-neon/70">// LIVE</span>
        <span>Secure Channel</span>
      </div>
    </div>
  );
}
