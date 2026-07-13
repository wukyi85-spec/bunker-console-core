import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Fingerprint, KeyRound, Loader2 } from "lucide-react";
import { Logo } from "@/components/bunker/Logo";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { AccessDenied } from "@/components/bunker/AccessDenied";
import { setPlayerProfile } from "@/lib/player";
import { setPlayerKey } from "@/lib/player-key";
import { loginMember, ensurePlayerStats } from "@/lib/bunker-supabase";

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

function LoginScreen() {
  const navigate = useNavigate();
  const [passId, setPassId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const member = await loginMember(passId.trim().toUpperCase(), password);
      if (!member) {
        setError("ACCESS DENIED — INVALID PASS ID OR PASSWORD");
        setVerifying(false);
        return;
      }
      const name = (member.playerName ?? "").trim();
      const isFirstLogin = !name || name.toUpperCase() === "EMPTY";
      setPlayerKey(member.passId);
      setPlayerProfile({
        memberId: member.id,
        passId: member.passId,
        playerName: isFirstLogin ? null : member.playerName,
        characterId: isFirstLogin ? null : member.characterId,
        firstLoginCompleted: !isFirstLogin,
      });
      if (isFirstLogin) {
        navigate({ to: "/onboarding" });
        return;
      }
      await ensurePlayerStats();
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("[BLACK'S BUNKER] login error:", err);
      setError("TRANSMISSION ERROR — TRY AGAIN");
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden bg-background px-6 py-6">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_78%)]" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neon/10 blur-3xl"
        style={{ animation: "bunker-ambient 9s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/3 h-[320px] w-[320px] rounded-full bg-neon/[0.04] blur-3xl"
        style={{ animation: "bunker-ambient 12s ease-in-out infinite reverse" }}
      />

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
        <Logo />
        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground/70">
          Authorized Access Only
        </span>
      </header>

      {/* Panel */}
      <main className="relative z-10 flex w-full max-w-md flex-1 items-center justify-center py-4">
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
                "Enter the Bunker"
              )}
            </BunkerButton>
          </form>
        </Panel>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground/60">
        <span>Members Only</span>
        <span>Version 1.0</span>
      </footer>

      <style>{`
        @keyframes bunker-ambient {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.9; }
          50% { transform: translate(-50%, 20px) scale(1.08); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
