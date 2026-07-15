import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/bunker/Logo";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { CharacterPortrait } from "@/components/bunker/CharacterPortrait";
import { CHARACTERS, getPlayerProfile, setPlayerProfile } from "@/lib/player";
import { useSheetCharacters } from "@/lib/characters";
import { completeMemberOnboarding, ensurePlayerStats } from "@/lib/bunker-supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "First Login — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingScreen,
});

const SAVE_STEPS = ["Saving Character...", "Creating Player Profile...", "Preparing Dashboard..."];
const NAME_RE = /^[A-Z0-9]{3,16}$/;

function OnboardingScreen() {
  const navigate = useNavigate();
  const { data: sheetCharacters, isLoading: charsLoading } = useSheetCharacters();
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [nameError, setNameError] = useState<string | null>(null);

  const characters = (sheetCharacters && sheetCharacters.length > 0)
    ? sheetCharacters.map((c) => ({ id: c.id, label: c.name || c.id, image: c.fullBody }))
    : CHARACTERS.map((c) => ({ id: c.id, label: c.label, image: "", codename: c.codename, accent: c.accent }));

  // Guard: if setup already done, jump straight to the dashboard.
  useEffect(() => {
    const p = getPlayerProfile();
    if (p.firstLoginCompleted) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  // Cycle saving messages
  useEffect(() => {
    if (!saving) return;
    const id = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, SAVE_STEPS.length - 1));
    }, 700);
    return () => window.clearInterval(id);
  }, [saving]);

  const canSubmit = !!characterId && NAME_RE.test(playerName);

  function handleNameChange(v: string) {
    const upper = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    setPlayerName(upper);
    if (upper.length === 0) setNameError(null);
    else if (!NAME_RE.test(upper)) setNameError("3–16 characters. Letters and numbers only.");
    else setNameError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const profile = getPlayerProfile();
      if (!profile.passId) throw new Error("Missing Pass ID — please sign in again.");
      await completeMemberOnboarding({
        passId: profile.passId,
        playerName,
        characterId: characterId!,
      });
      setPlayerProfile({
        characterId,
        playerName,
        firstLoginCompleted: true,
      });
      await ensurePlayerStats();
      window.setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, SAVE_STEPS.length * 700 + 400);
    } catch (err) {
      console.error("[ONBOARDING] save failed:", err);
      setNameError(err instanceof Error ? err.message : "Failed to save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-y-auto bg-background px-6 py-6">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_78%)]" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neon/10 blur-3xl"
        style={{ animation: "bunker-ambient 9s ease-in-out infinite" }}
      />

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <Logo />
        <h1 className="mt-2 text-center font-display text-2xl font-black uppercase tracking-[0.25em] text-foreground">
          Welcome to Black's Bunker
        </h1>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Complete your identity before entering the bunker.
        </p>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 py-6">
        {/* Step 1 */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <StepHeader index="01" title="Choose Your Character" />
          <div className={cn("mt-3 grid gap-3", characters.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
            {charsLoading && characters.length === 0 ? (
              <p className="col-span-full text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Loading characters...
              </p>
            ) : null}
            {characters.map((c, i) => {
              const selected = characterId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCharacterId(c.id)}
                  disabled={saving}
                  className={cn(
                    "group relative flex flex-col overflow-hidden border bg-panel text-left",
                    "transition-all duration-300 ease-out",
                    "animate-in fade-in",
                    selected
                      ? "border-neon scale-[1.03] shadow-[0_0_0_1px_var(--neon),0_10px_30px_-10px_color-mix(in_oklab,var(--neon)_60%,transparent)]"
                      : "border-border/60 hover:border-neon/40 hover:-translate-y-0.5",
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {c.image ? (
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-panel-elevated">
                      <img
                        src={c.image}
                        alt={c.label}
                        draggable={false}
                        className="h-full w-full object-contain object-bottom"
                      />
                    </div>
                  ) : (
                    <CharacterPortrait
                      codename={("codename" in c && c.codename) || c.label}
                      accent={("accent" in c && c.accent) || "#7CFF4D"}
                      selected={selected}
                    />
                  )}
                  <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">
                    <span className="font-display text-xs font-semibold uppercase tracking-widest text-foreground">
                      {c.label}
                    </span>
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center border",
                        selected
                          ? "border-neon bg-neon text-background"
                          : "border-border text-transparent",
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            Your first character selection is <span className="text-neon">FREE</span>. Future changes may require Gold.
          </p>
        </section>

        {/* Step 2 */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "150ms" }}>
          <StepHeader index="02" title="Player Name" />
          <Panel className="mt-3">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
              <BunkerInput
                name="player_name"
                label="Player Name"
                placeholder="TYPE YOUR HANDLE"
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={saving}
                maxLength={16}
              />
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]">
                <span className={cn("text-muted-foreground", nameError && "text-destructive")}>
                  {nameError ?? "3–16 chars • letters & numbers only"}
                </span>
                <span className="text-muted-foreground/70">{playerName.length}/16</span>
              </div>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80">
                This name can only be changed later using <span className="text-neon">Gold</span>.
              </p>

              <BunkerButton
                type="submit"
                size="lg"
                disabled={!canSubmit || saving}
                className="mt-1 w-full active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {SAVE_STEPS[stepIdx]}
                  </>
                ) : (
                  "Enter the Bunker"
                )}
              </BunkerButton>
            </form>
          </Panel>
        </section>
      </main>

      <style>{`
        @keyframes bunker-ambient {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.9; }
          50% { transform: translate(-50%, 20px) scale(1.08); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function StepHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon">STEP {index}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-neon/50 to-transparent" />
      <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-foreground">
        {title}
      </span>
    </div>
  );
}
