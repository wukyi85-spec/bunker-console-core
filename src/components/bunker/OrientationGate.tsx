import { useEffect, useState, type ReactNode } from "react";
import { RotateCw } from "lucide-react";

export function OrientationGate({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const check = () => {
      // Only enforce landscape on touch / small screens (mobile phones).
      // Desktop always allowed.
      const isPhone =
        window.matchMedia("(pointer: coarse)").matches &&
        Math.min(window.innerWidth, window.innerHeight) < 500;
      const isPortrait = window.innerHeight > window.innerWidth;
      setBlocked(isPhone && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return (
    <>
      {children}
      {blocked && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background px-8 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-md border border-neon/50 bg-panel">
            <RotateCw className="h-10 w-10 text-neon animate-hud-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon">
              // ACCESS CONDITION
            </span>
            <h1 className="font-display text-2xl font-black uppercase tracking-widest text-foreground">
              Rotate Device
            </h1>
            <p className="max-w-xs text-sm text-muted-foreground">
              Black&rsquo;s Bunker is a landscape-only operation. Turn your device sideways to enter.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
