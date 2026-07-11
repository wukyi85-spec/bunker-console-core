import type { ReactNode } from "react";
import heroImage from "@/assets/bunker-hero.jpg";

type DashboardHeroProps = {
  media?: ReactNode;
};

/**
 * Cinematic hero stage — moving fog, subtle camera breathing, ambient lights.
 * The media slot accepts image / video / 3D model.
 */
export function DashboardHero({ media }: DashboardHeroProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border/60 bg-panel shadow-hud animate-in fade-in duration-700">
      {/* Camera-breathing wrapper */}
      <div className="absolute inset-0 animate-camera-breathe">
        {/* Media layer */}
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

        {/* Moving fog — two layers, opposite directions */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-screen animate-fog"
          style={{
            background:
              "radial-gradient(60% 40% at 30% 65%, rgb(255 255 255 / 0.06), transparent 70%), radial-gradient(50% 35% at 70% 55%, rgb(200 220 255 / 0.05), transparent 75%)",
            filter: "blur(6px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-screen animate-fog-reverse"
          style={{
            background:
              "radial-gradient(45% 30% at 55% 80%, rgb(255 240 210 / 0.05), transparent 75%)",
            filter: "blur(10px)",
          }}
        />
      </div>

      {/* Cinematic vignettes */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/0.6)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-background/40" />

      {/* Ambient light sweeps */}
      <div className="pointer-events-none absolute -inset-1/4 opacity-45 animate-hero-drift-slow bg-[radial-gradient(circle_at_30%_40%,color-mix(in_oklab,var(--neon)_20%,transparent)_0%,transparent_45%)]" />
      <div className="pointer-events-none absolute -inset-1/4 opacity-35 animate-hero-drift-slower bg-[radial-gradient(circle_at_72%_62%,rgb(255_180_90/0.20)_0%,transparent_45%)]" />

      {/* Slow scanline sweep */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-neon/8 to-transparent" />

      {/* Tactical corner markers */}
      <CornerMark className="top-3 left-3" />
      <CornerMark className="top-3 right-3 rotate-90" />
      <CornerMark className="bottom-3 left-3 -rotate-90" />
      <CornerMark className="bottom-3 right-3 rotate-180" />

      {/* Top scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent" />

      {/* Bottom-left status caption */}
      <div className="absolute bottom-4 left-5 flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-neon animate-hud-pulse">
          // BUNKER ONLINE
        </span>
        <span className="font-display text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          Sector 07 · Secure
        </span>
      </div>

      {/* Bottom-right telemetry */}
      <div className="absolute bottom-4 right-5 flex flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
        <span className="text-neon/80">// LIVE</span>
        <span>47.812N · 122.335W</span>
      </div>
    </div>
  );
}

function CornerMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute h-5 w-5 border-l-2 border-t-2 border-neon/80 shadow-[0_0_10px_-2px_var(--neon)] ${className}`}
    />
  );
}
