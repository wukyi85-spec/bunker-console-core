import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/bunker/Logo";
import { PlayerHUD } from "@/components/bunker/PlayerHUD";
import { GameNav } from "@/components/bunker/GameNav";
import { BunkerAlarm } from "@/components/bunker/BunkerAlarm";
import heroImage from "@/assets/bunker-hero.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    
      <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
        {/* ============ FULLSCREEN BUNKER SCENE (zoomed ~15%) ============ */}
        <div className="absolute inset-0 animate-camera-breathe">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ transform: "scale(1.15)", transformOrigin: "center 45%" }}
            draggable={false}
          />
        </div>

        {/* Ambient fog layers */}
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

        {/* Cinematic vignette + top/bottom fades so HUD sits legible over scene */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(0_0_0/0.55)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/80 via-background/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />

        {/* Subtle HUD grid + scanline over everything */}
        <div className="pointer-events-none absolute inset-0 hud-grid opacity-15" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-neon/8 to-transparent" />

        {/* Top scanline hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

        {/* ============ FLOATING HUD OVERLAYS ============ */}

        {/* Top left — Logo only */}
        <div className="absolute left-4 top-4 z-20 md:left-6 md:top-5 animate-in fade-in slide-in-from-left-4 duration-700">
          <Logo />
        </div>

        {/* Top right — Player HUD + Bunker Alarm stack (20px gap) */}
        <div
          className="absolute right-4 top-4 z-20 md:right-6 md:top-5 flex flex-col animate-in fade-in slide-in-from-right-4 duration-700"
          style={{ width: 360, gap: 20 }}
        >
          <PlayerHUD />
          <div className="hidden sm:block">
            <BunkerAlarm />
          </div>
        </div>

        {/* Bottom-left tactical caption */}
        <div className="absolute bottom-6 left-5 z-10 flex flex-col gap-1 md:left-7 animate-in fade-in duration-1000">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon animate-hud-pulse">
            // BUNKER ONLINE
          </span>
          <span className="font-display text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Sector 07 · Secure Channel
          </span>
        </div>

        {/* Bottom-right telemetry */}
        <div className="absolute bottom-6 right-5 z-10 hidden flex-col items-end gap-1 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground md:flex md:right-7 animate-in fade-in duration-1000">
          <span className="text-neon/80">// LIVE</span>
          <span>47.812N · 122.335W</span>
        </div>

        {/* Bottom center — Floating nav dock */}
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <GameNav />
        </div>
      </div>
    
  );
}
