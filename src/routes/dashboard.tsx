import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/bunker/Logo";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPlaceholder,
});

function DashboardPlaceholder() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <Logo />
        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon">
          // DASHBOARD
        </span>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Access granted — dashboard coming next.
        </p>
      </div>
    </div>
  );
}
