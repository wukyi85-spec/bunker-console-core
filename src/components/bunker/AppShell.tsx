import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { GameNav } from "./GameNav";
import { BackToBunker } from "./BackToBunker";
import { NotificationPopup } from "./NotificationPopup";


interface AppShellProps {
  children: ReactNode;
  hideBack?: boolean;
  hideLogo?: boolean;
  hideNav?: boolean;
}

export function AppShell({
  children,
  hideBack = false,
  hideLogo = false,
  hideNav = false,
}: AppShellProps) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* Ambient lounge backdrop — very subtle, no green tint */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.03)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgb(0_0_0/0.6)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Top-left: Logo + Back button stack */}
      <header className="relative z-20 flex items-start justify-between gap-4 px-6 py-3 md:px-9 md:py-6 lphone:px-4 lphone:py-2">
        <div className="flex flex-col gap-3 lphone:gap-1.5">
          {!hideLogo && (
            <Link
              to="/dashboard"
              aria-label="Back to Dashboard"
              className="inline-flex rounded-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60"
            >
              <Logo />
            </Link>
          )}
          {!hideBack && <BackToBunker />}
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 px-6 pb-4 md:px-9 lphone:px-4 lphone:pb-2">
        {children}
      </main>

      {!hideNav && (
        <footer className="relative z-20 flex items-center justify-center px-4 pb-4 md:px-6 md:pb-5">
          <GameNav />
        </footer>
      )}


      <NotificationPopup />
    </div>
  );
}
