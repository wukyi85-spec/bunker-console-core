import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/bunker/AppShell";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { CharacterPortrait } from "@/components/bunker/CharacterPortrait";
import {
  getPlayerStats,
  updatePlayerProfileInfo,
  changePlayerName,
  listRanks,
} from "@/lib/bunker-supabase";
import { getPlayerProfile, setPlayerProfile, CHARACTERS } from "@/lib/player";
import { levelProgress, PROGRESSION } from "@/lib/progression";
import {
  Coins,
  Phone,
  MapPin,
  Save,
  Pencil,
  Zap,
} from "lucide-react";

import { ContactHQ } from "@/components/bunker/ContactHQ";
import { BadgeGlow, getRankTheme } from "@/components/bunker/BadgeGlow";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Player Profile — BLACK'S BUNKER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const profile = getPlayerProfile();
  const statsQ = useQuery({ queryKey: ["player_stats"], queryFn: getPlayerStats });
  const ranksQ = useQuery({ queryKey: ["ranks"], queryFn: listRanks });
  const stats: any = statsQ.data;

  const character =
    CHARACTERS.find((c) => c.id === profile.characterId) ?? CHARACTERS[0];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [savingInfo, setSavingInfo] = useState(false);

  const [changeOpen, setChangeOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (stats) {
      setFullName(stats.full_name ?? "");
      setPhone(stats.phone ?? "");
      setAddress(stats.default_address ?? "");
    }
  }, [stats?.player_key]);

  const rank = (stats?.current_rank ?? "ROOKIE").toUpperCase();
  const rankRow: any = (ranksQ.data ?? []).find(
    (r: any) => r.name?.toUpperCase() === rank,
  );
  const rankAccent = rankRow?.accent ?? "var(--neon)";
  const xpPct = stats ? levelProgress(stats.xp) : 0;
  const xpInLevel = stats ? stats.xp % PROGRESSION.xpPerLevel : 0;

  const memberSince = stats?.member_since
    ? new Date(stats.member_since).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "—";

  async function saveInfo() {
    setSavingInfo(true);
    try {
      await updatePlayerProfileInfo({
        fullName: fullName.trim(),
        phone: phone.trim(),
        defaultAddress: address.trim(),
      });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["player_stats"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Update failed");
    } finally {
      setSavingInfo(false);
    }
  }

  async function submitChangeName() {
    setConfirming(true);
    try {
      const trimmed = newName.trim().toUpperCase();
      const updated: any = await changePlayerName(trimmed);
      setPlayerProfile({ playerName: updated?.player_name ?? trimmed });
      toast.success("Player name updated");
      qc.invalidateQueries({ queryKey: ["player_stats"] });
      setChangeOpen(false);
      setConfirmStep(false);
      setNewName("");
    } catch (err: any) {
      toast.error(err?.message ?? "Change failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AppShell hideLogo hideNav>
      <div className="flex h-full w-full flex-col gap-3 overflow-y-auto animate-in fade-in duration-500">
        {/* ============ DIGITAL STONER PASS CARD ============ */}
        <Panel
          variant="elevated"
          corners
          className="corner-frame-lines relative overflow-hidden p-5"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, ${rankAccent}, transparent 55%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.08]" />

          <div className="relative grid grid-cols-[180px_1fr_260px] gap-5">
            {/* Portrait */}
            <div className="relative">
              <CharacterPortrait
                codename={character.codename}
                accent={character.accent}
                selected
                className="rounded-md border border-white/10"
              />
              <div className="pointer-events-none absolute -inset-0.5 rounded-md border border-neon/30 shadow-[0_0_25px_-6px_var(--neon)]" />
            </div>

            {/* Identity + Personal Info */}
            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  // Digital Stoner Pass
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="truncate font-display text-3xl font-black uppercase tracking-widest text-foreground">
                    {profile.playerName ?? "OPERATOR"}
                  </h1>
                  <button
                    onClick={() => {
                      setNewName("");
                      setConfirmStep(false);
                      setChangeOpen(true);
                    }}
                    className="rounded-sm border border-white/15 bg-black/40 p-1.5 text-muted-foreground transition-colors hover:border-neon/50 hover:text-neon"
                    aria-label="Change player name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  {character.codename} · {character.label}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 font-mono text-[10px] uppercase tracking-widest">
                <ReadonlyField label="Pass ID" value={profile.passId ?? "—"} />
                <ReadonlyField label="Member Since" value={memberSince} />
                <ReadonlyField
                  label="Status"
                  value="ACTIVE"
                  valueClass="text-neon"
                />
                <ReadonlyField
                  label="Gold"
                  value={(stats?.gold ?? 0).toLocaleString()}
                  valueClass="text-amber-300"
                />
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest">
                      Personal Information
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Used for auto-fill at checkout
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <BunkerInput
                    label="Full Name"
                    icon={<User className="h-3.5 w-3.5" />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your legal name"
                  />
                  <BunkerInput
                    label="Phone Number"
                    icon={<Phone className="h-3.5 w-3.5" />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+66 ..."
                    inputMode="tel"
                  />
                  <BunkerInput
                    label="Default Delivery Address"
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Drop location"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <BunkerButton onClick={saveInfo} disabled={savingInfo}>
                    <Save className="h-4 w-4" />
                    {savingInfo ? "Saving..." : "Save Changes"}
                  </BunkerButton>
                </div>
              </div>
            </div>


            {/* Rank / Stats */}
            <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/40 p-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const t = getRankTheme(rank);
                  return (
                    <BadgeGlow
                      src={rankRow?.badgeImage || null}
                      alt={rank}
                      size={44}
                      primary={rankAccent || t.primary}
                      secondary={t.secondary}
                      intensity="md"
                    />
                  );
                })()}
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
                    Current Rank
                  </div>
                  <div
                    className="font-display text-lg font-black uppercase tracking-widest"
                    style={{ color: rankAccent }}
                  >
                    {rank}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-neon" /> XP · LV{" "}
                    {stats?.level ?? 1}
                  </span>
                  <span className="text-neon">
                    {xpInLevel} / {PROGRESSION.xpPerLevel}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/60">
                  <div
                    className="h-full bg-gradient-to-r from-neon-dim via-neon to-neon shadow-[0_0_8px_-1px_var(--neon)] transition-[width] duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatChip
                  icon={<Shield className="h-3.5 w-3.5 text-neon" />}
                  label="Level"
                  value={String(stats?.level ?? 1)}
                />
                <StatChip
                  icon={<Coins className="h-3.5 w-3.5 text-amber-300" />}
                  label="Gold"
                  value={(stats?.gold ?? 0).toLocaleString()}
                />
                <StatChip
                  icon={<Trophy className="h-3.5 w-3.5 text-neon" />}
                  label="Total XP"
                  value={(stats?.xp ?? 0).toLocaleString()}
                />
                <StatChip
                  icon={<Star className="h-3.5 w-3.5 fill-neon text-neon" />}
                  label="Total Purchase"
                  value={`฿${Number(stats?.total_purchase ?? 0).toLocaleString()}`}
                />
                <StatChip
                  icon={<Zap className="h-3.5 w-3.5 text-neon" />}
                  label="Total Weight"
                  value={`${Number(stats?.total_weight ?? 0)}G`}
                />
              </div>
            </div>
          </div>
        </Panel>
        <div className="flex justify-end">
          <ContactHQ label="Contact HQ on Telegram" />
        </div>
      </div>


      {/* ========== Change Name Confirmation ========== */}
      {changeOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => !confirming && setChangeOpen(false)}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
          <div
            className="relative w-full max-w-md rounded-md border-2 border-neon/50 bg-panel p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon">
              // Rename Operator
            </div>
            <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-widest">
              Change Player Name?
            </h2>
            {(() => {
              const isFree = (stats?.name_change_count ?? 0) === 0;
              const cost = isFree ? 0 : 100;
              return (
                <>
                  <div
                    className={cn(
                      "mt-3 flex items-center gap-2 rounded-sm border px-3 py-2",
                      isFree
                        ? "border-neon/40 bg-neon/10"
                        : "border-amber-400/40 bg-amber-400/10",
                    )}
                  >
                    <Coins
                      className={cn("h-4 w-4", isFree ? "text-neon" : "text-amber-300")}
                    />
                    <span
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-widest",
                        isFree ? "text-neon" : "text-amber-200",
                      )}
                    >
                      {isFree ? "First change: FREE" : "Cost: 100 Gold"}
                    </span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Balance: {(stats?.gold ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4">
                    <BunkerInput
                      label="New Player Name"
                      value={newName}
                      onChange={(e) =>
                        setNewName(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
                      }
                      placeholder="3–16 CHARACTERS · A–Z 0–9"
                      maxLength={16}
                      autoFocus
                    />
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      Letters and numbers only. Automatically uppercase.
                    </p>
                  </div>

                  {confirmStep ? (
                    <div className="mt-4 flex gap-2">
                      <BunkerButton
                        variant="ghost"
                        className="flex-1"
                        disabled={confirming}
                        onClick={() => setConfirmStep(false)}
                      >
                        Cancel
                      </BunkerButton>
                      <BunkerButton
                        className="flex-1"
                        disabled={confirming}
                        onClick={submitChangeName}
                      >
                        {confirming
                          ? "Processing..."
                          : isFree
                            ? "Confirm · FREE"
                            : "Confirm · Pay 100 Gold"}
                      </BunkerButton>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <BunkerButton
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setChangeOpen(false)}
                      >
                        Cancel
                      </BunkerButton>
                      <BunkerButton
                        className="flex-1"
                        disabled={
                          newName.trim().length < 3 || (stats?.gold ?? 0) < cost
                        }
                        onClick={() => setConfirmStep(true)}
                      >
                        Continue
                      </BunkerButton>
                    </div>
                  )}
                </>
              );
            })()}

          </div>
        </div>
      )}
    </AppShell>
  );
}

function ReadonlyField({
  label,
  value,
  trailing,
  valueClass,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-white/10 bg-black/40 px-3 py-2">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className={cn("truncate font-display text-xs font-bold tracking-widest", valueClass ?? "text-foreground")}>
          {value}
        </div>
        {trailing}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-panel-elevated/60 px-2.5 py-1.5">
      {icon}
      <div className="min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-sm font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}
