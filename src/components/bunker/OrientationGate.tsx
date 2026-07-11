import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";

export function OrientationGate({ children }: { children: ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setReady(true);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <div
        className={
          "transition-opacity duration-500 " +
          (isPortrait ? "pointer-events-none opacity-0" : "opacity-100")
        }
      >
        {children}
      </div>

      <div
        aria-hidden={!isPortrait}
        className={
          "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-background px-8 text-center transition-opacity duration-500 " +
          (isPortrait ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        {/* Ambient layers */}
        <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 animate-hero-drift-slow bg-[radial-gradient(circle_at_30%_40%,color-mix(in_oklab,var(--neon)_14%,transparent)_0%,transparent_50%)]" />

        <Logo className="relative z-10" />

        {/* Rotating phone illustration */}
        <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-md glass-panel">
          <svg
            viewBox="0 0 100 100"
            className="h-24 w-24 animate-phone-rotate text-neon drop-shadow-[0_0_10px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
            style={{ transformOrigin: "50% 50%" }}
          >
            <rect
              x="34" y="10" width="32" height="80" rx="6"
              fill="none" stroke="currentColor" strokeWidth="3"
            />
            <rect x="40" y="18" width="20" height="60" rx="1" fill="currentColor" opacity="0.15" />
            <circle cx="50" cy="84" r="2" fill="currentColor" />
            <rect x="46" y="14" width="8" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
          {/* Arrow arc */}
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full text-neon/60"
          >
            <path
              d="M 20 50 A 30 30 0 0 1 80 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
            <polygon points="80,50 74,46 74,54" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 flex max-w-md flex-col gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon animate-hud-pulse">
            // ACCESS CONDITION
          </span>
          <h1 className="font-display text-3xl font-black uppercase tracking-[0.18em] text-foreground">
            Please Rotate Your Device
          </h1>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-neon">
            Landscape Mode Required
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-display font-bold text-foreground">BLACK&rsquo;S BUNKER</span> is
            engineered for a widescreen tactical experience.
          </p>
        </div>
      </div>
    </>
  );
}
