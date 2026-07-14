import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, XCircle, X, Zap, Coins, Trophy, Sparkles, Star } from "lucide-react";
import {
  listOrders,
  listPlayerNotifications,
  listRanks,
  getPlayerStats,
  markNotificationRead,
  type PlayerNotificationRow,
} from "@/lib/bunker-supabase";
import { calcLevel, PROGRESSION } from "@/lib/progression";
import { cn } from "@/lib/utils";

const POPUP_TYPES = new Set(["ORDER", "ORDER_CANCELLED", "ORDER_COMPLETED"]);

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

  if (cancelled) {
    return <CancelledOverlay notif={current} onClose={handleClose} />;
  }
  return <ConfirmedCinematic key={current.id} notif={current} onClose={handleClose} />;
}

// ============================================================
// CANCELLED — unchanged behavior
// ============================================================
function CancelledOverlay({
  notif,
  onClose,
}: {
  notif: PlayerNotificationRow;
  onClose: () => void;
}) {
  const reasonMatch = notif.message.match(/Reason:\s*(.+)$/);
  const reason = reasonMatch ? reasonMatch[1] : null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-md border-2 border-red-500/60 bg-panel p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(239_68_68/0.18)_0%,transparent_65%)]" />
        <div className="relative mb-4">
          <span className="absolute inset-0 rounded-full bg-red-500/30 blur-2xl animate-hud-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500 bg-background">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <div className="relative font-mono text-[10px] uppercase tracking-[0.5em] text-red-400">
          // Transmission
        </div>
        <h1 className="relative mt-2 font-display text-3xl font-black uppercase tracking-widest text-foreground">
          Order Cancelled
        </h1>
        {notif.order_id && (
          <div className="relative mt-3 rounded-sm border border-white/10 bg-background/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Mission · <span className="text-foreground">{notif.order_id}</span>
          </div>
        )}
        {reason ? (
          <div className="relative mt-4 w-full rounded-sm border border-red-500/30 bg-red-500/5 px-4 py-3 text-left">
            <div className="font-mono text-[9px] uppercase tracking-widest text-red-400/80">Reason</div>
            <div className="mt-1 text-sm text-foreground">{reason}</div>
          </div>
        ) : (
          <p className="relative mt-3 max-w-sm text-sm text-muted-foreground">{notif.message}</p>
        )}
        <button
          onClick={onClose}
          className="relative mt-6 rounded-sm border border-red-500/60 bg-red-500/10 px-6 py-2 font-display text-xs font-bold uppercase tracking-[0.3em] text-red-300 transition-all hover:bg-red-500/20"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CONFIRMED — cinematic AAA sequence
// ============================================================
interface CinematicData {
  orderId: string;
  xpEarned: number;
  goldEarned: number;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  rankBefore: string | null;
  rankAfter: string | null;
  rankBeforeAccent: string | null;
  rankAfterAccent: string | null;
  xpInLevelBefore: number;
  xpInLevelAfter: number;
  xpPerLevel: number;
}

type Stage =
  | "incoming"
  | "mission"
  | "confirmed"
  | "rewards"
  | "levelup"
  | "rankup"
  | "done";

function ConfirmedCinematic({
  notif,
  onClose,
}: {
  notif: PlayerNotificationRow;
  onClose: () => void;
}) {
  const [data, setData] = useState<CinematicData | null>(null);
  const [stage, setStage] = useState<Stage>("incoming");
  const [ready, setReady] = useState(false);

  // Load real data once
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [orders, stats, ranks] = await Promise.all([
          listOrders(),
          getPlayerStats(),
          listRanks(),
        ]);
        if (cancelled) return;
        const order = orders.find((o: any) => o.mission_number === notif.order_id);
        const xpEarned = Number(order?.xp_earned ?? 0);
        const goldEarned = Number(order?.gold_earned ?? 0);
        const xpAfter = Number(stats?.xp ?? 0);
        const xpBefore = Math.max(0, xpAfter - xpEarned);
        const levelBefore = calcLevel(xpBefore);
        const levelAfter = calcLevel(xpAfter);
        const findRank = (xp: number) =>
          ranks.find((r: any) => xp >= r.min_xp && (r.max_xp == null || xp <= r.max_xp)) ?? null;
        const rBefore = findRank(xpBefore);
        const rAfter = findRank(xpAfter);
        const per = PROGRESSION.xpPerLevel;
        setData({
          orderId: notif.order_id ?? "",
          xpEarned,
          goldEarned,
          xpBefore,
          xpAfter,
          levelBefore,
          levelAfter,
          rankBefore: rBefore?.name ?? null,
          rankAfter: rAfter?.name ?? null,
          rankBeforeAccent: rBefore?.accent ?? null,
          rankAfterAccent: rAfter?.accent ?? null,
          xpInLevelBefore: xpBefore % per,
          xpInLevelAfter: xpAfter % per,
          xpPerLevel: per,
        });
        setReady(true);
      } catch {
        setReady(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [notif.order_id]);

  // Sequence timings
  useEffect(() => {
    if (!ready) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStage("mission"), 900));
    timers.push(window.setTimeout(() => setStage("confirmed"), 2000));
    timers.push(window.setTimeout(() => setStage("rewards"), 3100));
    // level/rank stages triggered inside rewards effect via data
    return () => timers.forEach(clearTimeout);
  }, [ready]);

  // After rewards animation, decide next
  useEffect(() => {
    if (stage !== "rewards" || !data) return;
    const t = window.setTimeout(() => {
      if (data.levelAfter > data.levelBefore) {
        setStage("levelup");
      } else if (data.rankAfter && data.rankAfter !== data.rankBefore) {
        setStage("rankup");
      } else {
        setStage("done");
      }
    }, 3200);
    return () => clearTimeout(t);
  }, [stage, data]);

  useEffect(() => {
    if (stage !== "levelup" || !data) return;
    const t = window.setTimeout(() => {
      if (data.rankAfter && data.rankAfter !== data.rankBefore) setStage("rankup");
      else setStage("done");
    }, 2600);
    return () => clearTimeout(t);
  }, [stage, data]);

  useEffect(() => {
    if (stage !== "rankup") return;
    const t = window.setTimeout(() => setStage("done"), 2800);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden animate-in fade-in duration-300">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Scanline atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* Radial neon glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_14%,transparent)_0%,transparent_60%)]" />

      <div className="relative flex w-full max-w-2xl flex-col items-center px-8 text-center">
        {stage === "incoming" && <IncomingTransmission />}
        {stage === "mission" && <BigTitle text="MISSION COMPLETE" accent />}
        {stage === "confirmed" && (
          <>
            <BigTitle text="ORDER CONFIRMED" accent />
            {data?.orderId && (
              <div className="mt-4 rounded-sm border border-neon/30 bg-background/60 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.4em] text-neon animate-in fade-in slide-in-from-bottom-2 duration-500">
                Mission · <span className="text-foreground">{data.orderId}</span>
              </div>
            )}
          </>
        )}
        {stage === "rewards" && data && <RewardsPanel data={data} />}
        {stage === "levelup" && data && <LevelUpBurst level={data.levelAfter} />}
        {stage === "rankup" && data && (
          <RankUp
            fromName={data.rankBefore}
            toName={data.rankAfter!}
            toAccent={data.rankAfterAccent}
          />
        )}

        {/* Continue button always available after confirmed appears */}
        {stage === "done" && (
          <button
            onClick={onClose}
            className="mt-2 rounded-sm border-2 border-neon bg-neon/10 px-10 py-3 font-display text-sm font-black uppercase tracking-[0.4em] text-neon shadow-[0_0_40px_-8px_color-mix(in_oklab,var(--neon)_70%,transparent)] transition-all hover:bg-neon/20 hover:scale-105 animate-in fade-in zoom-in-95 duration-500"
          >
            Continue
          </button>
        )}
      </div>

      {/* Skip / close - always available */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 rounded-sm border border-white/10 bg-background/40 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

// ------------ Sub-scenes ------------

function IncomingTransmission() {
  return (
    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-neon/40 blur-3xl animate-hud-pulse" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon/60 bg-background">
          <span className="h-3 w-3 rounded-full bg-neon shadow-[0_0_20px_var(--neon)] animate-pulse" />
        </div>
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.6em] text-neon animate-pulse">
        // Incoming Transmission
      </div>
      <div className="h-px w-64 bg-gradient-to-r from-transparent via-neon/60 to-transparent" />
    </div>
  );
}

function BigTitle({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <div
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.5em]",
          accent ? "text-neon" : "text-muted-foreground",
        )}
      >
        // Transmission
      </div>
      <h1
        className={cn(
          "mt-2 font-display text-5xl font-black uppercase tracking-widest text-foreground",
          "drop-shadow-[0_0_25px_color-mix(in_oklab,var(--neon)_60%,transparent)]",
        )}
      >
        {text}
      </h1>
      <div className="mt-3 h-px w-72 bg-gradient-to-r from-transparent via-neon/70 to-transparent" />
    </div>
  );
}

function RewardsPanel({ data }: { data: CinematicData }) {
  const xpPct = useMemo(() => {
    // From xpInLevelBefore/xpPerLevel → if leveled up, animate to 100% first (then LEVEL UP scene resets)
    const per = data.xpPerLevel;
    if (data.levelAfter > data.levelBefore) return 100;
    return Math.min(100, (data.xpInLevelAfter / per) * 100);
  }, [data]);
  const xpStartPct = Math.min(100, (data.xpInLevelBefore / data.xpPerLevel) * 100);

  return (
    <div className="flex w-full flex-col items-center gap-5 animate-in fade-in duration-500">
      <BigTitle text="REWARDS EARNED" accent />

      <div className="mt-2 grid w-full max-w-lg grid-cols-2 gap-4">
        <RewardTile
          icon={<Zap className="h-6 w-6 text-neon" />}
          label="XP"
          value={data.xpEarned}
          color="var(--neon)"
          delay={200}
        />
        <RewardTile
          icon={<Coins className="h-6 w-6 text-amber-300" />}
          label="Gold"
          value={data.goldEarned}
          color="rgb(252 211 77)"
          delay={800}
        />
      </div>

      {/* XP Bar */}
      <div className="mt-2 w-full max-w-lg">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          <span>Level {data.levelBefore}</span>
          <span className="text-neon">
            {data.xpAfter.toLocaleString()} XP
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/10 bg-background/80">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)]" />
          <XpFill startPct={xpStartPct} endPct={xpPct} />
        </div>
      </div>
    </div>
  );
}

function RewardTile({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border-2 bg-panel/80 p-4 backdrop-blur-md transition-all duration-500",
        show ? "opacity-100 scale-100 border-white/20" : "opacity-0 scale-90 border-white/5",
      )}
      style={{ boxShadow: show ? `0 0 40px -12px ${color}` : undefined }}
    >
      <div
        className="pointer-events-none absolute -inset-1 opacity-0 blur-xl transition-opacity duration-700"
        style={{ background: color, opacity: show ? 0.15 : 0 }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full border bg-background"
          style={{ borderColor: color }}
        >
          {icon}
        </div>
        <div className="flex flex-col items-start">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            + {label}
          </div>
          <div
            className="font-display text-3xl font-black tabular-nums"
            style={{ color }}
          >
            {show ? <CountUp to={value} duration={1200} /> : "0"}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountUp({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

function XpFill({ startPct, endPct }: { startPct: number; endPct: number }) {
  const [pct, setPct] = useState(startPct);
  useEffect(() => {
    const t = window.setTimeout(() => setPct(endPct), 1400);
    return () => clearTimeout(t);
  }, [endPct]);
  return (
    <div
      className="relative h-full bg-gradient-to-r from-neon/70 via-neon to-neon/70 shadow-[0_0_20px_var(--neon)] transition-all duration-[1600ms] ease-out"
      style={{ width: `${pct}%` }}
    >
      <div className="absolute inset-y-0 right-0 w-1 bg-white/80 blur-[2px]" />
    </div>
  );
}

function LevelUpBurst({ level }: { level: number }) {
  return (
    <div className="relative flex flex-col items-center animate-in fade-in zoom-in-50 duration-700">
      <div className="pointer-events-none absolute -inset-32 animate-hud-pulse rounded-full bg-neon/20 blur-3xl" />
      <div className="relative flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.5em] text-neon">
        <Sparkles className="h-4 w-4" />
        <span>System</span>
        <Sparkles className="h-4 w-4" />
      </div>
      <h1
        className="relative mt-2 font-display text-7xl font-black uppercase tracking-[0.15em] text-neon"
        style={{
          textShadow:
            "0 0 30px var(--neon), 0 0 60px color-mix(in oklab, var(--neon) 50%, transparent)",
        }}
      >
        LEVEL UP
      </h1>
      <div className="relative mt-4 flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          New Level
        </span>
        <span className="font-display text-5xl font-black tabular-nums text-foreground">
          {level}
        </span>
      </div>
      <div className="relative mt-4 h-px w-80 bg-gradient-to-r from-transparent via-neon to-transparent" />
    </div>
  );
}

function RankUp({
  fromName,
  toName,
  toAccent,
}: {
  fromName: string | null;
  toName: string;
  toAccent: string | null;
}) {
  const accent = toAccent ?? "var(--neon)";
  return (
    <div className="relative flex flex-col items-center animate-in fade-in duration-700">
      <div
        className="pointer-events-none absolute -inset-32 animate-hud-pulse rounded-full blur-3xl"
        style={{ background: `${accent}33` }}
      />
      <div className="relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.5em]" style={{ color: accent }}>
        <Trophy className="h-4 w-4" />
        <span>Rank Promotion</span>
        <Trophy className="h-4 w-4" />
      </div>
      <h1
        className="relative mt-3 font-display text-6xl font-black uppercase tracking-[0.2em]"
        style={{ color: accent, textShadow: `0 0 30px ${accent}` }}
      >
        RANK UP
      </h1>
      <div className="relative mt-6 flex items-center gap-6 font-display text-xl font-bold uppercase tracking-[0.35em]">
        <span className="text-muted-foreground line-through">{fromName ?? "—"}</span>
        <span className="text-2xl" style={{ color: accent }}>
          →
        </span>
        <span
          className="text-3xl animate-in zoom-in-75 duration-700"
          style={{ color: accent, textShadow: `0 0 20px ${accent}` }}
        >
          {toName}
        </span>
      </div>
      <div className="relative mt-6 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 animate-in fade-in zoom-in-50"
            style={{
              color: accent,
              fill: accent,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
