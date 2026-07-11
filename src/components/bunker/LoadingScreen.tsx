import { useEffect, useMemo, useState } from "react";
import { Logo } from "./Logo";

const MESSAGES = [
  "Checking Access...",
  "Initializing Systems...",
  "Loading Player Data...",
  "Syncing Bunker...",
  "Preparing Dashboard...",
];

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Progress 0 -> 100 over ~5s
  useEffect(() => {
    const start = performance.now();
    const duration = 5000;
    let raf = 0;
    const tick = (t: number) => {
      const pct = Math.min(100, ((t - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cycle messages every second
  useEffect(() => {
    const id = window.setInterval(() => {
      setMessageIdx((i) => (i + 1) % MESSAGES.length);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // At 100%, pause ~1s then complete with fade-out
  useEffect(() => {
    if (progress < 100) return;
    const fadeTimer = window.setTimeout(() => setExiting(true), 700);
    const doneTimer = window.setTimeout(() => onComplete(), 1300);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [progress, onComplete]);

  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 1.5,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [],
  );

  return (
    <div
      className={
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-700 " +
        (exiting ? "opacity-0" : "opacity-100 animate-in fade-in duration-500")
      }
    >
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_80%)]" />

      {/* Subtle drifting particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-neon"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animation: `bunker-drift ${p.duration}s ease-in-out ${p.delay}s infinite`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      {/* Scanline */}
      <div
        className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent"
        style={{ animation: "bunker-scan 6s linear infinite" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        <div className="scale-125">
          <Logo />
        </div>

        <div className="flex flex-col items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon animate-hud-pulse">
            // INITIALIZING...
          </span>

          <div className="flex w-[min(60vw,420px)] flex-col gap-2">
            <div className="h-1 w-full overflow-hidden rounded-sm bg-panel-elevated">
              <div
                className="h-full bg-neon shadow-[0_0_12px_color-mix(in_oklab,var(--neon)_60%,transparent)] transition-[width] duration-150 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span key={messageIdx} className="animate-in fade-in duration-300 text-foreground/80">
                {MESSAGES[messageIdx]}
              </span>
              <span className="text-neon">{Math.floor(progress).toString().padStart(3, "0")}%</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bunker-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(6px, -14px); }
        }
        @keyframes bunker-scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
