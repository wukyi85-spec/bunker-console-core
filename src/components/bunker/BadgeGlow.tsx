import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeGlowProps {
  src?: string | null;
  alt?: string;
  size?: number; // px
  primary?: string;
  secondary?: string | null;
  intensity?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Renders a transparent PNG rank badge with outer glow + drop shadow +
 * bloom + subtle pulse. NEVER draws a circle/frame/background behind it.
 * Falls back to a Shield icon when no PNG is available.
 */
export function BadgeGlow({
  src,
  alt = "Rank badge",
  size = 40,
  primary = "#7CFF6B",
  secondary = null,
  intensity = "md",
  className,
}: BadgeGlowProps) {
  // Glow layers scale with intensity so 24–28px HUD badge feels subtle while
  // the 80–100px rank page badge feels dramatic.
  const inner =
    intensity === "sm" ? 4 : intensity === "lg" ? 12 : 7;
  const mid =
    intensity === "sm" ? 8 : intensity === "lg" ? 22 : 14;
  const outer =
    intensity === "sm" ? 14 : intensity === "lg" ? 38 : 24;

  const c2 = secondary ?? primary;
  const filter = [
    `drop-shadow(0 0 ${inner}px ${primary})`,
    `drop-shadow(0 0 ${mid}px ${c2})`,
    `drop-shadow(0 ${Math.round(mid / 3)}px ${outer}px rgba(0,0,0,0.55))`,
  ].join(" ");

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center animate-badge-pulse",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={!src}
    >
      {/* Ambient bloom halo — no visible frame, just soft light */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full blur-xl opacity-70"
        style={{
          background: `radial-gradient(circle, ${primary}55, transparent 65%)`,
        }}
      />
      {secondary && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{
            background: `radial-gradient(circle, ${secondary}44, transparent 70%)`,
          }}
        />
      )}
      {src ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="relative h-full w-full object-contain"
          style={{ filter }}
        />
      ) : (
        <Shield
          className="relative"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            color: primary,
            filter,
          }}
        />
      )}
    </span>
  );
}

/** Theme lookup for the three canonical ranks. */
export function getRankTheme(name?: string | null): {
  primary: string;
  secondary: string | null;
  stars: number;
  crown: boolean;
  label: string;
} {
  const key = (name ?? "").toUpperCase().trim();
  if (key.includes("BLACK"))
    return { primary: "#FFD54A", secondary: "#7CFF6B", stars: 5, crown: true, label: "BLACK" };
  if (key === "OG" || key.includes("OG"))
    return { primary: "#A86BFF", secondary: "#D8D8DE", stars: 3, crown: false, label: "OG" };
  return { primary: "#7CFF6B", secondary: "#B0793A", stars: 1, crown: false, label: "ROOKIE" };
}
