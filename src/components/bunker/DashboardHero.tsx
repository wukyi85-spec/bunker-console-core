import type { ReactNode } from "react";
import heroImage from "@/assets/bunker-hero.jpg";

type DashboardHeroProps = {
  /**
   * Slot for future media: <img>, <video>, <canvas>, or a 3D model viewer.
   * When omitted, a premium placeholder image is rendered.
   */
  media?: ReactNode;
};

/**
 * Cinematic hero stage for the dashboard.
 *
 * Renders a single media slot (image / video / 3D) inside a tactical frame
 * with slow ambient lighting. The container is layout-agnostic — the parent
 * decides width, height, and position on the screen.
 */
export function DashboardHero({ media }: DashboardHeroProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border/60 bg-panel shadow-hud animate-in fade-in duration-700">
      {/* Media layer — image / video / 3D model plugs in here */}
      <div className="absolute inset-0">
        {media ?? (
          <img
            src={heroImage}
            alt=""
            width={1536}
            height={1024}
            className="h-full w-full object-cover object-center opacity-90"
            draggable={false}
          />
        )}
      </div>

      {/* Cinematic vignettes */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(0_0_0/0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

      {/* Very slow ambient light sweeps */}
      <div className="pointer-events-none absolute -inset-1/4 opacity-40 animate-hero-drift-slow bg-[radial-gradient(circle_at_30%_40%,color-mix(in_oklab,var(--neon)_18%,transparent)_0%,transparent_45%)]" />
      <div className="pointer-events-none absolute -inset-1/4 opacity-30 animate-hero-drift-slower bg-[radial-gradient(circle_at_70%_60%,rgb(255_180_90/0.18)_0%,transparent_45%)]" />

      {/* Tactical corner markers */}
      <CornerMark className="top-3 left-3" />
      <CornerMark className="top-3 right-3 rotate-90" />
      <CornerMark className="bottom-3 left-3 -rotate-90" />
      <CornerMark className="bottom-3 right-3 rotate-180" />

      {/* Subtle scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent" />

      {/* Bottom-left status caption */}
      <div className="absolute bottom-4 left-5 flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-neon animate-hud-pulse">
          // BUNKER ONLINE
        </span>
        <span className="font-display text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          Sector 07 · Secure
        </span>
      </div>
    </div>
  );
}

function CornerMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute h-4 w-4 border-l-2 border-t-2 border-neon/70 ${className}`}
    />
  );
}
