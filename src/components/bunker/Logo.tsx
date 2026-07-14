import { cn } from "@/lib/utils";

/**
 * BLACK'S BUNKER — Premium shield emblem.
 *
 * A carved gunmetal shield with beveled edges, corner ticks, a subtle
 * scanline sheen, and an inner monogram plate. Every ~14s the plate
 * splits along the center seam, revealing a glowing cannabis leaf that
 * blooms out with radiating light rays, then closes back to the final
 * BB monogram.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("group flex items-center gap-3 select-none", className)}>
      <div className="relative flex h-12 w-11 items-center justify-center">
        {/* Ambient neon halo that swells with the vault cycle */}
        <span
          className="pointer-events-none absolute -inset-3 rounded-full bg-neon/25 blur-2xl animate-vault-glow"
          aria-hidden
        />

        {/* Shield outline + bevel */}
        <svg
          viewBox="0 0 44 48"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="bb-shield-body" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#232323" />
              <stop offset="0.55" stopColor="#131313" />
              <stop offset="1" stopColor="#050505" />
            </linearGradient>
            <linearGradient id="bb-shield-edge" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--neon)" stopOpacity="1" />
              <stop offset="0.5" stopColor="var(--neon)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--neon)" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="bb-shield-sheen" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer bevel */}
          <path
            d="M22 1.2 L41.6 7.7 V25.6 C41.6 37.4 33 44.6 22 46.9 C11 44.6 2.4 37.4 2.4 25.6 V7.7 Z"
            fill="url(#bb-shield-body)"
            stroke="url(#bb-shield-edge)"
            strokeWidth="1.4"
          />
          {/* Inner engraved line */}
          <path
            d="M22 4.2 L38.6 9.7 V25.4 C38.6 35.4 31.2 41.8 22 43.9 C12.8 41.8 5.4 35.4 5.4 25.4 V9.7 Z"
            fill="none"
            stroke="var(--neon)"
            strokeOpacity="0.35"
            strokeWidth="0.5"
          />
          {/* Glass sheen along the top */}
          <path
            d="M22 1.2 L41.6 7.7 V16 C34 12.5 28 11 22 11 C16 11 10 12.5 2.4 16 V7.7 Z"
            fill="url(#bb-shield-sheen)"
          />
          {/* Corner ticks */}
          <path d="M5.6 10.2 L5.6 7 L8.8 7" fill="none" stroke="var(--neon)" strokeWidth="0.7" opacity="0.9" />
          <path d="M38.4 10.2 L38.4 7 L35.2 7" fill="none" stroke="var(--neon)" strokeWidth="0.7" opacity="0.9" />
          <path d="M8.8 41.5 L5.6 40.2" fill="none" stroke="var(--neon)" strokeOpacity="0.6" strokeWidth="0.6" />
          <path d="M35.2 41.5 L38.4 40.2" fill="none" stroke="var(--neon)" strokeOpacity="0.6" strokeWidth="0.6" />
        </svg>

        {/* Interior clipped to shield */}
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              'path("M22 4.2 L38.6 9.7 V25.4 C38.6 35.4 31.2 41.8 22 43.9 C12.8 41.8 5.4 35.4 5.4 25.4 V9.7 Z")',
          }}
        >
          {/* Deep vault interior */}
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#1a1a1a,#050505_70%)]" />
          {/* Subtle scanlines */}
          <span
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)",
            }}
          />

          {/* Radiating light rays during reveal */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center animate-vault-rays">
            <span
              className="h-16 w-16 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--neon) 55%, transparent) 6deg, transparent 12deg, transparent 30deg, color-mix(in oklab, var(--neon) 45%, transparent) 36deg, transparent 42deg, transparent 60deg, color-mix(in oklab, var(--neon) 55%, transparent) 66deg, transparent 72deg, transparent 90deg, color-mix(in oklab, var(--neon) 45%, transparent) 96deg, transparent 102deg, transparent 120deg, color-mix(in oklab, var(--neon) 55%, transparent) 126deg, transparent 132deg, transparent 360deg)",
                filter: "blur(1.5px)",
                maskImage:
                  "radial-gradient(circle, black 0%, black 55%, transparent 78%)",
                WebkitMaskImage:
                  "radial-gradient(circle, black 0%, black 55%, transparent 78%)",
              }}
            />
          </span>

          {/* Cannabis leaf — blooms during the reveal */}
          <div className="absolute inset-0 flex items-center justify-center animate-vault-leaf">
            <span
              className="absolute h-9 w-9 rounded-full bg-neon/60 blur-lg"
              aria-hidden
            />
            <svg
              viewBox="0 0 24 24"
              className="relative h-6 w-6"
              style={{
                filter:
                  "drop-shadow(0 0 6px var(--neon)) drop-shadow(0 0 14px color-mix(in oklab, var(--neon) 70%, transparent))",
              }}
              aria-hidden
            >
              <path
                fill="var(--neon)"
                d="M12 2c.4 2.6 1 5.3 2.2 7.5C15 8.2 16 7 17.4 6c-.4 2.3-1 4.4-2 6.4 1.8-.6 3.5-.9 5.6-.9-1.5 1.6-3.2 2.8-5.2 3.7 1.5.5 2.9 1.3 4.2 2.4-2 .2-4 0-5.9-.6.5 1.2 1.2 2.4 2.2 3.5-1.5-.2-2.8-.7-4.3-1.5.1 1 .3 2 .6 3H10c.3-1 .5-2 .6-3-1.5.8-2.8 1.3-4.3 1.5 1-1.1 1.7-2.3 2.2-3.5-1.9.6-3.9.8-5.9.6 1.3-1.1 2.7-1.9 4.2-2.4-2-.9-3.7-2.1-5.2-3.7 2.1 0 3.8.3 5.6.9-1-2-1.6-4.1-2-6.4C6.6 7 7.6 8.2 8.4 9.5 9.6 7.3 10.2 4.6 10.6 2h2.8Z"
              />
            </svg>
          </div>

          {/* Vault doors */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 origin-left animate-vault-left"
            style={{
              background:
                "linear-gradient(100deg,#050505 0%,#161616 40%,#242424 70%,#101010 100%)",
              boxShadow:
                "inset -2px 0 6px rgba(0,0,0,0.75), inset 1px 0 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Rivets */}
            <span className="absolute left-[16%] top-[18%] h-[3px] w-[3px] rounded-full bg-neon/70 shadow-[0_0_4px_var(--neon)]" />
            <span className="absolute left-[16%] bottom-[18%] h-[3px] w-[3px] rounded-full bg-neon/70 shadow-[0_0_4px_var(--neon)]" />
            {/* Left half of monogram — engraved */}
            <span
              className="absolute inset-0 flex items-center justify-end pr-[3px] font-display text-[16px] font-black leading-none"
              style={{
                color: "#e9e9e9",
                textShadow:
                  "0 0 1px rgba(255,255,255,0.5), 0 1px 0 rgba(0,0,0,0.9), 0 0 10px color-mix(in oklab, var(--neon) 40%, transparent)",
              }}
            >
              B
            </span>
          </div>
          <div
            className="absolute inset-y-0 right-0 w-1/2 origin-right animate-vault-right"
            style={{
              background:
                "linear-gradient(-100deg,#050505 0%,#161616 40%,#242424 70%,#101010 100%)",
              boxShadow:
                "inset 2px 0 6px rgba(0,0,0,0.75), inset -1px 0 0 rgba(255,255,255,0.06)",
            }}
          >
            <span className="absolute right-[16%] top-[18%] h-[3px] w-[3px] rounded-full bg-neon/70 shadow-[0_0_4px_var(--neon)]" />
            <span className="absolute right-[16%] bottom-[18%] h-[3px] w-[3px] rounded-full bg-neon/70 shadow-[0_0_4px_var(--neon)]" />
            <span
              className="absolute inset-0 flex items-center justify-start pl-[3px] font-display text-[16px] font-black leading-none"
              style={{
                color: "#e9e9e9",
                textShadow:
                  "0 0 1px rgba(255,255,255,0.5), 0 1px 0 rgba(0,0,0,0.9), 0 0 10px color-mix(in oklab, var(--neon) 40%, transparent)",
              }}
            >
              B
            </span>
          </div>

          {/* Center seam — glows during opening */}
          <span className="pointer-events-none absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-neon/70 to-transparent animate-vault-seam" />
        </div>

        {/* Live status dot */}
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-neon animate-hud-pulse shadow-[0_0_10px_var(--neon)]" />
      </div>

      {/* Wordmark */}
      <span
        className="font-display text-[15px] font-black uppercase tracking-[0.3em] text-foreground leading-none"
        style={{
          textShadow:
            "0 0 14px color-mix(in oklab, var(--neon) 32%, transparent)",
        }}
      >
        BLACK&rsquo;S BUNKER
      </span>
    </div>
  );
}
