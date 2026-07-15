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
      <div className="flex h-full w-full items-center justify-center p-2 animate-in fade-in duration-700">
        <Panel
          variant="elevated"
          corners
          className="corner-frame-lines relative flex w-full max-w-md lphone:max-w-[420px] flex-col items-center overflow-hidden p-4 lphone:p-3 text-center"
        >
          {/* Ambient success glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_18%,transparent)_0%,transparent_65%)]" />
          <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />

          {/* Icon */}
          <div className="relative mb-2 lphone:mb-1">
            <span className="absolute inset-0 rounded-full bg-neon/30 blur-2xl animate-hud-pulse" />
            <div className="relative flex h-12 w-12 lphone:h-10 lphone:w-10 items-center justify-center rounded-full border-2 border-neon bg-background">
              <CheckCircle2 className="h-6 w-6 lphone:h-5 lphone:w-5 text-neon animate-in zoom-in duration-500" />
            </div>
          </div>

          <div className="relative font-mono text-[9px] lphone:text-[8px] uppercase tracking-[0.5em] text-neon">
            // Transmission Received
          </div>
          <h1 className="relative mt-1 font-display text-xl lphone:text-lg font-bold uppercase tracking-widest text-foreground">
            Order Submitted
          </h1>
          <div className="relative mt-1.5 inline-flex items-center gap-2 rounded-sm border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 font-display text-[10px] lphone:text-[9px] font-black uppercase tracking-[0.3em] text-amber-300">
            <span className="h-1.5 w-1.5 animate-hud-pulse rounded-full bg-amber-300" />
            Waiting for Confirmation
          </div>

          <p className="relative mt-2 max-w-sm text-xs lphone:text-[11px] leading-snug text-muted-foreground">
            Please wait for BLACK'S BUNKER to confirm your order. You will be notified in your
            Bunker Alarm once confirmed.
          </p>

          {id && (
            <div className="relative mt-2 rounded-sm border border-border/60 bg-background/50 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Order ID · <span className="text-neon">{id}</span>
            </div>
          )}

          <div className="relative mt-3 flex flex-wrap justify-center gap-2">
            <Link to="/dashboard">
              <BunkerButton variant="outline" className="text-[11px] lphone:text-[10px]">Return to Bunker</BunkerButton>
            </Link>
            <Link to="/mission-log">
              <BunkerButton variant="primary" className="text-[11px] lphone:text-[10px]">View Mission Log</BunkerButton>
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
