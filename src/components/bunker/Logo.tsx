import { cn } from "@/lib/utils";

/**
 * BLACK'S BUNKER shield emblem.
 * A shield-shaped "BB" that periodically opens like two vault doors,
 * revealing a glowing cannabis leaf, then closes again. Loops ~12s.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("group flex items-center gap-3 select-none", className)}>
      <div className="relative flex h-12 w-11 items-center justify-center">
        {/* Ambient neon glow that pulses with the vault cycle */}
        <span
          className="pointer-events-none absolute -inset-2 rounded-full bg-neon/30 blur-xl animate-vault-glow"
          aria-hidden
        />

        {/* Shield frame */}
        <svg
          viewBox="0 0 44 48"
          className="absolute inset-0 h-full w-full drop-shadow-[0_0_8px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="bb-shield-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#161616" />
              <stop offset="1" stopColor="#050505" />
            </linearGradient>
            <linearGradient id="bb-shield-stroke" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--neon)" stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--neon)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d="M22 1.5 L41 8 V25.5 C41 37.2 32.6 44.3 22 46.5 C11.4 44.3 3 37.2 3 25.5 V8 Z"
            fill="url(#bb-shield-fill)"
            stroke="url(#bb-shield-stroke)"
            strokeWidth="1.2"
          />
          {/* Corner ticks */}
          <path d="M6 9 L6 6 L9 6" fill="none" stroke="var(--neon)" strokeWidth="0.8" opacity="0.9" />
          <path d="M38 9 L38 6 L35 6" fill="none" stroke="var(--neon)" strokeWidth="0.8" opacity="0.9" />
        </svg>

        {/* Interior (clipped to shield) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              'path("M22 1.5 L41 8 V25.5 C41 37.2 32.6 44.3 22 46.5 C11.4 44.3 3 37.2 3 25.5 V8 Z")',
          }}
        >
          {/* Vault interior backdrop */}
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_oklab,var(--neon)_35%,transparent),transparent_70%)]" />

          {/* Cannabis leaf — appears while doors are open */}
          <div className="absolute inset-0 flex items-center justify-center animate-vault-leaf">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              style={{
                filter:
                  "drop-shadow(0 0 6px var(--neon)) drop-shadow(0 0 12px color-mix(in oklab, var(--neon) 60%, transparent))",
              }}
              aria-hidden
            >
              <path
                fill="var(--neon)"
                d="M12 2c.4 2.6 1 5.3 2.2 7.5C15 8.2 16 7 17.4 6c-.4 2.3-1 4.4-2 6.4 1.8-.6 3.5-.9 5.6-.9-1.5 1.6-3.2 2.8-5.2 3.7 1.5.5 2.9 1.3 4.2 2.4-2 .2-4 0-5.9-.6.5 1.2 1.2 2.4 2.2 3.5-1.5-.2-2.8-.7-4.3-1.5.1 1 .3 2 .6 3H10c.3-1 .5-2 .6-3-1.5.8-2.8 1.3-4.3 1.5 1-1.1 1.7-2.3 2.2-3.5-1.9.6-3.9.8-5.9.6 1.3-1.1 2.7-1.9 4.2-2.4-2-.9-3.7-2.1-5.2-3.7 2.1 0 3.8.3 5.6.9-1-2-1.6-4.1-2-6.4C6.6 7 7.6 8.2 8.4 9.5 9.6 7.3 10.2 4.6 10.6 2h2.8Z"
              />
            </svg>
          </div>

          {/* Vault doors — hinged at outer edges, split at center */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 origin-left animate-vault-left border-r border-neon/60"
            style={{
              background:
                "linear-gradient(90deg,#0d0d0d 0%,#1a1a1a 60%,#232323 100%)",
              boxShadow:
                "inset -2px 0 4px rgba(0,0,0,0.6), inset 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Rivet dots */}
            <span className="absolute left-[18%] top-[22%] h-[3px] w-[3px] rounded-full bg-neon/60" />
            <span className="absolute left-[18%] bottom-[22%] h-[3px] w-[3px] rounded-full bg-neon/60" />
            {/* Left half of "BB" */}
            <span
              className="absolute inset-0 flex items-center justify-end pr-[3px] font-display text-[15px] font-black leading-none text-neon"
              style={{ textShadow: "0 0 8px var(--neon)" }}
            >
              B
            </span>
          </div>
          <div
            className="absolute inset-y-0 right-0 w-1/2 origin-right animate-vault-right border-l border-neon/60"
            style={{
              background:
                "linear-gradient(-90deg,#0d0d0d 0%,#1a1a1a 60%,#232323 100%)",
              boxShadow:
                "inset 2px 0 4px rgba(0,0,0,0.6), inset -1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            <span className="absolute right-[18%] top-[22%] h-[3px] w-[3px] rounded-full bg-neon/60" />
            <span className="absolute right-[18%] bottom-[22%] h-[3px] w-[3px] rounded-full bg-neon/60" />
            <span
              className="absolute inset-0 flex items-center justify-start pl-[3px] font-display text-[15px] font-black leading-none text-neon"
              style={{ textShadow: "0 0 8px var(--neon)" }}
            >
              B
            </span>
          </div>

          {/* Center seam */}
          <span className="pointer-events-none absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-neon/40 to-transparent" />
        </div>

        {/* Status dot */}
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-neon animate-hud-pulse shadow-[0_0_10px_var(--neon)]" />
      </div>

      {/* Wordmark — clean GTA-style military UI */}
      <div className="flex flex-col leading-none gap-1">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.5em] text-neon/70">
          // Members
        </span>
        <span
          className="font-display text-[15px] font-black uppercase tracking-[0.28em] text-foreground"
          style={{
            textShadow:
              "0 0 14px color-mix(in oklab, var(--neon) 28%, transparent)",
          }}
        >
          BLACK&rsquo;S BUNKER
        </span>
      </div>
    </div>
  );
}
