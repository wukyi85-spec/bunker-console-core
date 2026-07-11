import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bunker/AppShell";
import { DashboardHero } from "@/components/bunker/DashboardHero";
import { BunkerAlarm } from "@/components/bunker/BunkerAlarm";

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
        {/* Deep ambient bunker lighting */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 top-0 h-[140%] w-[70%] rounded-full bg-[radial-gradient(circle,rgb(255_170_80/0.06)_0%,transparent_60%)] animate-hero-drift-slower" />
          <div className="absolute -right-1/4 bottom-0 h-[120%] w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--neon)_10%,transparent)_0%,transparent_65%)] animate-hero-drift-slow" />
        </div>

        {/* Hero + right alarm panel */}
        <div className="relative flex h-full w-full items-stretch gap-4 md:gap-6">
          <div className="relative h-full w-[70%] max-w-[70%]">
            <DashboardHero />
          </div>

          <div className="relative hidden h-full flex-1 sm:flex">
            <BunkerAlarm />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
