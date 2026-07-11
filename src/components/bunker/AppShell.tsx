import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { PlayerHUD } from "./PlayerHUD";
import { GameNav } from "./GameNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_70%)]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />
        <div className="hidden sm:block">
          <PlayerHUD />
        </div>
      </header>

      {/* Center stage */}
      <main className="relative z-10 flex-1 min-h-0 px-4 pb-3 md:px-6">
        {children}
      </main>

      {/* Bottom nav */}
      <footer className="relative z-10 flex items-center justify-center px-4 pb-3 md:px-6 md:pb-4">
        <GameNav />
      </footer>
    </div>
  );
}
