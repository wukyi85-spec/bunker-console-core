import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-complete")({
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Transmitted — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderCompletePage,
});

function OrderCompletePage() {
  const { id } = Route.useSearch();

  return (
    <AppShell hideLogo hideNav>
      <div className="flex h-full w-full items-center justify-center animate-in fade-in duration-700">
        <Panel
          variant="elevated"
          corners
          className="corner-frame-lines relative flex w-full max-w-xl flex-col items-center overflow-hidden p-6 text-center"
        >
          {/* Ambient success glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_18%,transparent)_0%,transparent_65%)]" />
          <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />

          {/* Icon */}
          <div className="relative mb-3">
            <span className="absolute inset-0 rounded-full bg-neon/30 blur-2xl animate-hud-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon bg-background">
              <CheckCircle2 className="h-8 w-8 text-neon animate-in zoom-in duration-500" />
            </div>
          </div>

          <div className="relative font-mono text-[10px] uppercase tracking-[0.5em] text-neon">
            // Transmission Received
          </div>
          <h1 className="relative mt-2 font-display text-3xl font-bold uppercase tracking-widest text-foreground">
            Order Submitted
          </h1>
          <div className="relative mt-2 inline-flex items-center gap-2 rounded-sm border border-amber-400/50 bg-amber-400/10 px-3 py-1 font-display text-[11px] font-black uppercase tracking-[0.3em] text-amber-300">
            <span className="h-1.5 w-1.5 animate-hud-pulse rounded-full bg-amber-300" />
            Waiting for Confirmation
          </div>

          <p className="relative mt-4 max-w-sm text-sm text-muted-foreground">
            Please wait for BLACK'S BUNKER to confirm your order. You will be notified in your
            Bunker Alarm once confirmed.
          </p>

          {id && (
            <div className="relative mt-3 rounded-sm border border-border/60 bg-background/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Order ID · <span className="text-neon">{id}</span>
            </div>
          )}

          <div className="relative mt-5 flex gap-2">
            <Link to="/dashboard">
              <BunkerButton variant="outline">Return to Bunker</BunkerButton>
            </Link>
            <Link to="/mission-log">
              <BunkerButton variant="primary">View Mission Log</BunkerButton>
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
