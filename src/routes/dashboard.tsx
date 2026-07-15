import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/bunker/Logo";
import { PlayerHUD } from "@/components/bunker/PlayerHUD";
import { GameNav } from "@/components/bunker/GameNav";
import { BunkerAlarm } from "@/components/bunker/BunkerAlarm";
import { ContactHQ } from "@/components/bunker/ContactHQ";
import heroImage from "@/assets/bunker-hero.jpg";
import { useCurrentCharacter } from "@/lib/characters";
import { getPlayerStats } from "@/lib/bunker-supabase";
import { getRankSettings } from "@/lib/sheets.functions";
import { getRankTheme } from "@/components/bunker/BadgeGlow";



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
  const character = useCurrentCharacter();

  // Rank-based character glow
  const statsQ = useQuery({
    queryKey: ["player_stats"],
    queryFn: getPlayerStats,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchInterval: 5000,
    staleTime: 0,
  });
  const fetchRanks = useServerFn(getRankSettings);
  const ranksQ = useQuery({
    queryKey: ["sheet_ranks"],
    queryFn: fetchRanks,
    staleTime: 60_000,
  });
  const xp = statsQ.data?.xp ?? 0;
  const currentRank = (ranksQ.data ?? []).find(
    (r) => xp >= r.minXp && xp <= r.maxXp,
  );
  const rankName = (currentRank?.name ?? statsQ.data?.current_rank ?? "ROOKIE").toUpperCase();
  const theme = getRankTheme(rankName);
  const glow = theme.primary;
  const glow2 = theme.secondary ?? theme.primary;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      {/* ============ FULLSCREEN BUNKER SCENE (light blur, darkened) ============ */}
      <div className="absolute inset-0 animate-camera-breathe">
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover object-center"
          style={{
            transform: "scale(1.08)",
            transformOrigin: "center 45%",
            filter: "blur(0px) brightness(0.75)",
          }}
          draggable={false}
        />
      </div>

      {/* Single soft ambient fog layer (static, very low opacity) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-40"
        style={{
          background:
            "radial-gradient(70% 55% at 25% 70%, color-mix(in oklab, var(--foreground) 3%, transparent), transparent 70%), radial-gradient(65% 60% at 75% 40%, color-mix(in oklab, var(--neon) 3%, transparent), transparent 75%)",
          filter: "blur(8px)",
        }}
      />

      {/* Soft neon side glow (static) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-60"
        style={{
          background:
            "radial-gradient(75% 100% at 0% 55%, color-mix(in oklab, var(--neon) 7%, transparent), transparent 60%), radial-gradient(65% 90% at 100% 45%, color-mix(in oklab, var(--neon) 4%, transparent), transparent 55%)",
          filter: "blur(12px)",
        }}
      />

      {/* Cinematic vignette + top/bottom fades so HUD sits legible over scene */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/0.65)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-32 bg-gradient-to-b from-background/80 via-background/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-44 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />

      {/* Subtle HUD grid (static, very low opacity) */}
      <div className="pointer-events-none absolute inset-0 z-0 hud-grid opacity-8" />

      {/* Top scanline hairline (static) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-neon/25 to-transparent" />

      {/* ============ CHARACTER STAGE (bottom-left, ~85% height, soft rank glow) ============ */}
      {character?.fullBody ? (
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-[85%] aspect-[3/4] max-w-[55%]">
          {/* Single soft rank-based ambient glow behind character */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(45% 55% at 50% 55%, ${glow}40, transparent 70%)`,
              filter: "blur(18px)",
            }}
          />

          {/* Ground shadow */}
          <div
            className="absolute bottom-[2%] left-[8%] right-[8%] h-[6%]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, transparent 75%)",
              filter: "blur(4px)",
            }}
          />

          {/* Character */}
          <img
            src={character.fullBody}
            alt={character.name}
            draggable={false}
            className="relative h-full w-full object-contain object-bottom select-none"
            style={{
              filter: `drop-shadow(0 0 10px ${glow}40) drop-shadow(0 8px 16px rgba(0,0,0,0.65))`,
            }}
          />
        </div>
      ) : null}

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

      {/* Top right — Player HUD + Bunker Alarm stacked */}
      <div className="absolute right-6 top-5 z-30 flex w-[360px] origin-top-right flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-700 lphone:right-3 lphone:top-3 lphone:w-[310px] lphone:scale-[0.72]">
        <PlayerHUD onClick={() => navigate({ to: "/profile" })} className="w-full shrink-0" />
        <div className="h-[230px] w-full shrink-0">
          <BunkerAlarm />
        </div>
      </div>

      {/* Bottom-right tactical caption + Contact HQ (kept clear of the character) */}
      <div className="absolute bottom-28 right-5 z-20 flex flex-col items-end gap-2 md:right-7 animate-in fade-in duration-1000 lphone:hidden">
        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon">
          // BUNKER ONLINE
        </span>
        <span className="font-display text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Sector 07 · Secure Channel
        </span>
        <ContactHQ className="mt-1 w-fit" />
      </div>

      {/* Bottom center — Floating nav dock */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex origin-bottom justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 lphone:bottom-1 lphone:scale-[0.6]">
        <GameNav />
      </div>
    </div>
  );
}
