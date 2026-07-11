import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bunker/AppShell";
import { DashboardHero } from "@/components/bunker/DashboardHero";

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
    <AppShell>
      <div className="relative h-full w-full animate-in fade-in duration-700">
        {/* Deep ambient bunker lighting — very slow drift */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 top-0 h-[140%] w-[70%] rounded-full bg-[radial-gradient(circle,rgb(255_170_80/0.06)_0%,transparent_60%)] animate-hero-drift-slower" />
          <div className="absolute -right-1/4 bottom-0 h-[120%] w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--neon)_10%,transparent)_0%,transparent_65%)] animate-hero-drift-slow" />
        </div>

        {/* Hero + reserved cinematic space (~70/30 split, slightly left) */}
        <div className="relative flex h-full w-full items-stretch gap-4 md:gap-6">
          {/* Hero stage */}
          <div className="relative h-full w-[70%] max-w-[70%]">
            <DashboardHero />
          </div>

          {/* Reserved right column — intentional negative space */}
          <div className="relative hidden h-full flex-1 sm:flex flex-col justify-between py-2 pr-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
                Live Feed
              </span>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-neon/80">
                // Standby
              </span>
              <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Awaiting deployment
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
