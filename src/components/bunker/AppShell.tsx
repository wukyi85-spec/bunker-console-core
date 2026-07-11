import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { GameNav } from "./GameNav";
import { BackToBunker } from "./BackToBunker";

interface AppShellProps {
  children: ReactNode;
  /** Hide the "Back to Bunker" button (e.g. on dashboard itself). */
  hideBack?: boolean;
}

export function AppShell({ children, hideBack = false }: AppShellProps) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* Ambient lounge backdrop — very subtle, no green tint */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.03)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgb(0_0_0/0.6)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Top-left: Logo + Back button stack */}
      <header className="relative z-20 flex items-start justify-between gap-4 px-6 py-5 md:px-9 md:py-6">
        <div className="flex flex-col gap-3">
          <Logo />
          {!hideBack && <BackToBunker />}
        </div>
      </header>

      {/* Center stage — internal pages get the full horizontal room */}
      <main className="relative z-10 flex-1 min-h-0 px-6 pb-4 md:px-9">
        {children}
      </main>

      {/* Bottom nav */}
      <footer className="relative z-20 flex items-center justify-center px-4 pb-4 md:px-6 md:pb-5">
        <GameNav />
      </footer>
    </div>
  );
}
