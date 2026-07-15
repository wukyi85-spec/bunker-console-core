import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Fingerprint, KeyRound, Loader2 } from "lucide-react";
import { Logo } from "@/components/bunker/Logo";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { AccessDenied } from "@/components/bunker/AccessDenied";
import { setPlayerProfile } from "@/lib/player";
import { setPlayerKey } from "@/lib/player-key";
import { setAdminSession, clearAdminSession } from "@/lib/admin-session";
import { loginMember, ensurePlayerStats } from "@/lib/bunker-supabase";
import { cn } from "@/lib/utils";
import bunkerEntry from "@/assets/bunker-entry.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Authorized Access — BLACK'S BUNKER" },
      { name: "description", content: "Members-only tactical access terminal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginScreen,
});

type Stage = "gate" | "form" | "opening";

function LoginScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("gate");
  const [passId, setPassId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextRoute, setNextRoute] = useState<"/dashboard" | "/onboarding" | "/admin/members" | null>(null);

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
      document.documentElement.classList.add("ios-device");
    }
    return () => {
      document.documentElement.classList.remove("ios-device");
    };
  }, []);

  // Fullscreen is controlled globally by double-tap gesture in SoundProvider.

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const normalizedPassId = passId.trim().toUpperCase();
      const normalizedPassword = password.trim();
      const member = await loginMember(normalizedPassId, normalizedPassword);
      console.log("[LOGIN] pass_id:", normalizedPassId, "found:", !!member, "role:", member?.role, "status:", member?.status);
      if (!member) {
        setError("ACCESS DENIED — INVALID PASS ID OR PASSWORD");
        setVerifying(false);
        return;
      }
      setPlayerKey(member.passId);
      setPlayerProfile({
        memberId: member.id,
        passId: member.passId,
        playerName: member.playerName,
        characterId: member.characterId,
        firstLoginCompleted: !!(member.playerName && member.characterId),
      });

      let target: "/dashboard" | "/onboarding" | "/admin/members" = "/dashboard";
      if (member.status !== "active") {
        target = "/admin/members";
      } else if (member.role === "admin") {
        setAdminSession({ passId: normalizedPassId, password: normalizedPassword });
        target = "/admin/members";
      } else {
        clearAdminSession();
        await ensurePlayerStats();
        if (!member.playerName || !member.characterId) target = "/onboarding";
      }

      // Play bunker-door opening animation, then continue.
      setNextRoute(target);
      setStage("opening");
      window.setTimeout(() => navigate({ to: target }), 4600);
    } catch (err) {
      console.error("[LOGIN] error:", err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`LOGIN ERROR: ${msg}`);
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden bg-background px-6 py-6">
      {/* GTA-inspired underground bunker background */}
      <div className="absolute inset-0">
        <img
          src={bunkerEntry}
          alt=""
          draggable={false}
          className="h-full w-full object-cover object-center animate-camera-breathe"
          style={{ transform: "scale(1.08)" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.35)_0%,rgb(0_0_0/0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/85" />
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.08]" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neon/10 blur-3xl"
        style={{ animation: "bunker-ambient 9s ease-in-out infinite" }}
      />

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
        <Logo />
        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/70">
          Authorized Access Only
        </span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex w-full max-w-md flex-1 items-center justify-center py-4">
        {stage === "gate" ? (
          <div className="flex w-full flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neon/90">
                Members Only
              </span>
              <h1 className="text-center font-display text-2xl font-black uppercase tracking-[0.28em] text-foreground drop-shadow-[0_2px_10px_rgb(0_0_0/0.8)]">
                Have a Stoner Pass?
              </h1>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Access is restricted to verified operatives.
              </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <BunkerButton
                type="button"
                size="lg"
                onClick={() => setStage("form")}
                className="w-full active:scale-[0.98]"
              >
                ENTER BUNKER
              </BunkerButton>
              <p className="text-center font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground/60">
                Double-tap anywhere · Fullscreen
              </p>
            </div>
          </div>
        ) : (
          <Panel
            corners
            className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon">
                  // Secure Terminal
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
                  Online
                </span>
              </div>

              {error && <AccessDenied message={error} />}

              <BunkerInput
                name="pass_id"
                label="Stoner Pass ID"
                placeholder="ENTER PASS ID"
                autoComplete="username"
                icon={<Fingerprint className="h-4 w-4" />}
                value={passId}
                onChange={(e) => setPassId(e.target.value)}
                disabled={verifying}
                required
              />

              <BunkerInput
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                icon={<KeyRound className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifying}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-muted-foreground transition-colors hover:text-neon focus-visible:text-neon focus-visible:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <BunkerButton
                type="submit"
                size="lg"
                disabled={verifying}
                className="mt-2 w-full active:scale-[0.98]"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying Access...
                  </>
                ) : (
                  "Authenticate"
                )}
              </BunkerButton>
            </form>
          </Panel>
        )}
      </main>

      {/* Footer — subtle brand mark */}
      <footer className="relative z-10 flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground/50">
          Black&rsquo;s Joint Smoking Accessories &nbsp;·&nbsp; Black&rsquo;s Joint &amp; Bud
        </span>
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.42em] text-foreground/70">
          BLACK&rsquo;S BUNKER <span className="text-muted-foreground/50">— Version 1.0</span>
        </span>
      </footer>

      {/* ================ BUNKER DOOR OPENING OVERLAY ================ */}
      {stage === "opening" && <BunkerDoorOpening target={nextRoute} />}

      <style>{`
        @keyframes bunker-ambient {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.9; }
          50% { transform: translate(-50%, 20px) scale(1.08); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function BunkerDoorOpening({ target: _target }: { target: string | null }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 overflow-hidden bg-black",
        "animate-in fade-in duration-300",
      )}
    >
      {/* ============ CAMERA RIG — pushes forward through the doorway ============ */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ animation: "cam-push 4.6s cubic-bezier(0.6,0,0.25,1) forwards" }}
      >
        {/* Interior neon light (revealed as doors open) */}
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 52%, color-mix(in oklab, var(--neon) 55%, transparent) 0%, color-mix(in oklab, var(--neon) 18%, transparent) 28%, transparent 60%)",
            opacity: 0,
            animation: "interior-bloom 3.2s ease-out 1s forwards",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 52%, rgb(255 255 255 / 0.35) 0%, transparent 22%)",
            opacity: 0,
            animation: "interior-bloom 3.2s ease-out 1.15s forwards",
          }}
        />

        {/* Volumetric god-rays streaming out */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-[220%] w-3 origin-center bg-gradient-to-b from-transparent via-neon/30 to-transparent blur-md"
              style={{
                transform: `rotate(${i * 15 - 90}deg)`,
                opacity: 0,
                animation: `door-ray 2.6s ease-out ${1.2 + i * 0.05}s forwards`,
              }}
            />
          ))}
        </div>

        {/* ============ VAULT DOOR ASSEMBLY ============ */}
        <div
          className="absolute inset-0"
          style={{ animation: "vault-appear 900ms cubic-bezier(0.2,0.8,0.2,1) 250ms both" }}
        >
          {/* Left door */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-neon/50 bg-gradient-to-l from-panel-elevated via-background to-black shadow-[inset_-60px_0_120px_-20px_rgb(0_0_0/0.95)]"
            style={{
              animation:
                "door-open-left 1.6s cubic-bezier(0.7,0,0.2,1) 1.15s forwards, door-shake 0.35s ease-in-out 0.9s 2",
            }}
          >
            <div className="pointer-events-none absolute inset-0 hud-grid opacity-25" />
            <div className="pointer-events-none absolute inset-6 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((r) => (
                <div key={r} className="flex justify-between">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon/35 shadow-[0_0_4px_var(--neon)]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neon/35 shadow-[0_0_4px_var(--neon)]" />
                </div>
              ))}
            </div>
            {/* Vault wheel */}
            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
              <div className="relative h-36 w-36">
                <span className="absolute inset-0 rounded-full border-2 border-neon/55 bg-neon/5 shadow-[0_0_60px_-6px_var(--neon)]" />
                <span className="absolute inset-3 rounded-full border border-neon/40 animate-badge-spin" />
                <span className="absolute inset-6 rounded-full border border-dashed border-neon/30" />
                <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon shadow-[0_0_12px_var(--neon)]" />
              </div>
            </div>
            {/* Seam glow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-neon shadow-[0_0_28px_var(--neon)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-neon/50 to-transparent" />
          </div>

          {/* Right door */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-neon/50 bg-gradient-to-r from-panel-elevated via-background to-black shadow-[inset_60px_0_120px_-20px_rgb(0_0_0/0.95)]"
            style={{
              animation:
                "door-open-right 1.6s cubic-bezier(0.7,0,0.2,1) 1.15s forwards, door-shake 0.35s ease-in-out 0.9s 2",
            }}
          >
            <div className="pointer-events-none absolute inset-0 hud-grid opacity-25" />
            <div className="pointer-events-none absolute inset-6 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((r) => (
                <div key={r} className="flex justify-between">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon/35 shadow-[0_0_4px_var(--neon)]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neon/35 shadow-[0_0_4px_var(--neon)]" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
              <div className="relative h-36 w-36">
                <span className="absolute inset-0 rounded-full border-2 border-neon/55 bg-neon/5 shadow-[0_0_60px_-6px_var(--neon)]" />
                <span
                  className="absolute inset-3 rounded-full border border-neon/40 animate-badge-spin"
                  style={{ animationDirection: "reverse" }}
                />
                <span className="absolute inset-6 rounded-full border border-dashed border-neon/30" />
                <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon shadow-[0_0_12px_var(--neon)]" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-neon shadow-[0_0_28px_var(--neon)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-neon/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* ============ CINEMATIC MESSAGES ============ */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
        <span
          className="absolute font-display text-lg font-semibold uppercase tracking-[0.32em] text-foreground/95 drop-shadow-[0_2px_12px_rgb(0_0_0/0.9)]"
          style={{ opacity: 0, animation: "msg-fade 1.4s ease-in-out 0.4s forwards" }}
        >
          Thank you for choosing Us.
        </span>
        <h2
          className="absolute font-display text-2xl font-black uppercase tracking-[0.4em] text-foreground drop-shadow-[0_2px_14px_rgb(0_0_0/0.9)]"
          style={{
            opacity: 0,
            animation: "msg-fade 1.4s ease-in-out 1.9s forwards",
            textShadow: "0 0 26px color-mix(in oklab, var(--neon) 65%, transparent)",
          }}
        >
          Welcome to BLACK&rsquo;S BUNKER
        </h2>
        <span
          className="absolute font-mono text-[11px] uppercase tracking-[0.6em] text-neon"
          style={{
            opacity: 0,
            animation: "msg-fade 1.3s ease-in-out 3.3s forwards",
            textShadow: "0 0 18px var(--neon)",
          }}
        >
          Access Granted
        </span>
      </div>

      {/* White flash at the moment of entry */}
      <div
        className="pointer-events-none absolute inset-0 z-30 bg-white"
        style={{ opacity: 0, animation: "entry-flash 900ms ease-out 3.9s forwards" }}
      />

      <style>{`
        @keyframes vault-appear {
          0%   { transform: scale(0.6); opacity: 0; filter: blur(6px); }
          100% { transform: scale(1);   opacity: 1; filter: blur(0); }
        }
        @keyframes cam-push {
          0%   { transform: scale(1)    translateZ(0); }
          55%  { transform: scale(1.08); }
          100% { transform: scale(2.4); }
        }
        @keyframes door-open-left {
          0%   { transform: translateX(0); }
          8%   { transform: translateX(-0.6%); }
          100% { transform: translateX(-102%); }
        }
        @keyframes door-open-right {
          0%   { transform: translateX(0); }
          8%   { transform: translateX(0.6%); }
          100% { transform: translateX(102%); }
        }
        @keyframes door-ray {
          0%   { opacity: 0; transform: rotate(var(--r, 0deg)) scaleY(0.2); }
          40%  { opacity: 0.75; }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) scaleY(1.6); }
        }
        @keyframes interior-bloom {
          0%   { opacity: 0; }
          40%  { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes msg-fade {
          0%   { opacity: 0; transform: translateY(6px); }
          20%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes entry-flash {
          0%   { opacity: 0; }
          30%  { opacity: 0.85; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}


