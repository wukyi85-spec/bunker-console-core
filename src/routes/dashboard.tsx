import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/bunker/Logo";
import { PlayerHUD } from "@/components/bunker/PlayerHUD";
import { GameNav } from "@/components/bunker/GameNav";
import { BunkerAlarm } from "@/components/bunker/BunkerAlarm";
import { ContactHQ } from "@/components/bunker/ContactHQ";
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
  const navigate = useNavigate();
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

        {/* GTA-style volumetric god-rays from top */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-screen opacity-60"
          style={{
            background:
              "conic-gradient(from 220deg at 50% -20%, transparent 0deg, color-mix(in oklab, var(--neon) 18%, transparent) 15deg, transparent 30deg, color-mix(in oklab, var(--neon) 12%, transparent) 55deg, transparent 80deg)",
            filter: "blur(18px)",
          }}
        />
        {/* Warm bunker firelight bottom */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 mix-blend-screen opacity-70"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 100%, rgb(255 170 90 / 0.14), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        {/* Cinematic vignette + top/bottom fades so HUD sits legible over scene */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/0.65)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/85 via-background/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background/90 via-background/45 to-transparent" />
        {/* Chromatic edge tint for cinematic feel */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.35)_0%,transparent_15%,transparent_85%,rgb(0_0_0/0.35)_100%)]" />
        {/* Film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
          }}
        />

        {/* Subtle HUD grid + scanline over everything */}
        <div className="pointer-events-none absolute inset-0 hud-grid opacity-15" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-neon/8 to-transparent" />

        {/* Top scanline hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />


        {/* ============ FLOATING HUD OVERLAYS ============ */}

        {/* Top left — Logo only */}
        <div className="absolute left-4 top-4 z-20 md:left-6 md:top-5 animate-in fade-in slide-in-from-left-4 duration-700">
          <Link
            to="/dashboard"
            aria-label="Back to Dashboard"
            className="inline-flex rounded-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60"
          >
            <Logo />
          </Link>
        </div>

        {/* Top right — Player HUD + Bunker Alarm stack */}
        <div
          className="absolute z-20 flex flex-col animate-in fade-in slide-in-from-right-4 duration-700 left-4 right-4 top-16 gap-3.5 sm:left-auto sm:right-6 sm:top-5 sm:w-[360px] sm:gap-5"
        >
          <PlayerHUD onClick={() => navigate({ to: "/profile" })} className="w-full" />
          <BunkerAlarm />
        </div>

        {/* Bottom-left tactical caption + Contact HQ */}
        <div className="absolute bottom-6 left-5 z-20 flex flex-col gap-2 md:left-7 animate-in fade-in duration-1000 max-sm:bottom-[132px] max-sm:left-3 max-sm:gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon animate-hud-pulse max-sm:text-[8px]">
            // BUNKER ONLINE
          </span>
          <span className="font-display text-[11px] uppercase tracking-[0.35em] text-muted-foreground max-sm:text-[9px]">
            Sector 07 · Secure Channel
          </span>
          <ContactHQ className="mt-1 w-fit max-sm:hidden" />
          <ContactHQ compact className="mt-0.5 w-fit sm:hidden" />
        </div>


        {/* Bottom-right telemetry */}
        <div className="absolute bottom-6 right-5 z-10 hidden flex-col items-end gap-1 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground md:flex md:right-7 animate-in fade-in duration-1000">
          <span className="text-neon/80">// LIVE</span>
          <span>47.812N · 122.335W</span>
        </div>

        {/* Bottom center — Floating nav dock */}
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-sm:px-2">
          <GameNav />
        </div>
      </div>
    
  );
}
