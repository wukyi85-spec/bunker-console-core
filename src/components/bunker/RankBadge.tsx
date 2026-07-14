import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  name?: string | null;
  badgeImage?: string | null;
  accent?: string | null;
  level?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLevel?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "h-12 w-12", inner: "p-1", letter: "text-base", lvl: "text-[8px] px-1 py-[1px]" },
  md: { box: "h-16 w-16", inner: "p-1.5", letter: "text-lg", lvl: "text-[9px] px-1 py-[1px]" },
  lg: { box: "h-24 w-24", inner: "p-2", letter: "text-2xl", lvl: "text-[10px] px-1.5 py-[1px]" },
  xl: { box: "h-32 w-32", inner: "p-2.5", letter: "text-3xl", lvl: "text-[11px] px-2 py-0.5" },
};

export function RankBadge({
  name,
  badgeImage,
  accent,
  level,
  size = "md",
  showLevel = true,
  className,
}: RankBadgeProps) {
  const s = SIZE_MAP[size];
  const color = accent || "var(--neon)";
  return (
    <div
      className={cn("relative flex items-center justify-center", s.box, className)}
      style={{
        // Use CSS var so shadow/color pick accent dynamically
        // @ts-expect-error CSS custom property
        "--rank-accent": color,
      }}
    >
      {/* Outer ambient glow */}
      <span
        className="pointer-events-none absolute -inset-2 rounded-full opacity-70 blur-xl"
        style={{ background: `radial-gradient(circle, ${color}44, transparent 70%)` }}
      />
      {/* Rotating conic ring */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full animate-badge-spin"
        style={{
          background: `conic-gradient(from 0deg, ${color}00 0deg, ${color}cc 90deg, ${color}00 180deg, ${color}66 270deg, ${color}00 360deg)`,
          WebkitMask:
            "radial-gradient(circle, transparent 58%, black 60%, black 66%, transparent 68%)",
          mask:
            "radial-gradient(circle, transparent 58%, black 60%, black 66%, transparent 68%)",
        }}
      />
      {/* Body */}
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-background"
        style={{
          borderColor: color,
          boxShadow: `0 0 24px -6px ${color}, inset 0 0 24px -8px ${color}`,
        }}
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle at 50% 30%, ${color}30, transparent 70%)` }}
        />
        {badgeImage ? (
          <img
            src={badgeImage}
            alt={name ?? "Rank"}
            className={cn("relative h-full w-full object-contain", s.inner)}
            draggable={false}
          />
        ) : name ? (
          <span
            className={cn("relative font-display font-black uppercase tracking-widest", s.letter)}
            style={{ color, textShadow: `0 0 12px ${color}` }}
          >
            {name[0]}
          </span>
        ) : (
          <Shield className="relative h-1/2 w-1/2" style={{ color }} />
        )}
      </div>

      {showLevel && typeof level === "number" && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 rounded-sm border-2 border-background font-mono font-bold text-background",
            s.lvl,
          )}
          style={{
            background: color,
            boxShadow: `0 0 8px -1px ${color}`,
          }}
        >
          {String(level).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
