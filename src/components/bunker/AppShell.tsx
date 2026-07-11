import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { PlayerHUD } from "./PlayerHUD";
import { GameNav } from "./GameNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

      {/* Top bar */}
      <header className="relative z-20 flex items-start justify-between gap-4 px-5 py-4 md:px-7">
        <Logo />
        <PlayerHUD />
      </header>

      {/* Center stage */}
      <main className="relative z-10 flex-1 min-h-0 px-5 pb-3 md:px-7">
        {children}
      </main>

      {/* Bottom nav */}
      <footer className="relative z-20 flex items-center justify-center px-4 pb-3 md:px-6 md:pb-4">
        <GameNav />
      </footer>
    </div>
  );
}
