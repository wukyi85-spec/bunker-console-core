import { useEffect, useState, type ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Logo } from "./Logo";

export function OrientationGate({ children }: { children: ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      // Universal portrait detection — desktop is virtually always landscape,
      // so this only meaningfully blocks phones/tablets held upright.
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
          "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background px-8 text-center transition-opacity duration-500 " +
          (isPortrait ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />

        <Logo className="relative z-10" />

        <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-md border border-neon/50 bg-panel shadow-[var(--shadow-hud)]">
          <RotateCw
            className="h-12 w-12 text-neon animate-hud-pulse"
            style={{ animation: "hud-pulse 2s ease-in-out infinite, spin 4s linear infinite" }}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-3 max-w-md">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon">
            // ACCESS CONDITION
          </span>
          <h1 className="font-display text-3xl font-black uppercase tracking-[0.15em] text-foreground">
            Rotate Your Device
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-display font-bold text-foreground">BLACK&rsquo;S BUNKER</span> is
            optimized for Landscape Mode.
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/70">
            Rotate your phone to continue.
          </p>
        </div>
      </div>
    </>
  );
}
