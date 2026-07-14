import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { getRankSettings } from "@/lib/sheets.functions";
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
  const fetchRanksSheet = useServerFn(getRankSettings);
  const ranksSheetQ = useQuery({
    queryKey: ["sheet_ranks"],
    queryFn: fetchRanksSheet,
    staleTime: 60_000,
  });
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
  const sheetRankRow = (ranksSheetQ.data ?? []).find(
    (r) => r.name?.toUpperCase() === rank,
  );
  const rankBadgeImage = sheetRankRow?.badgeImage ?? rankRow?.badge_image_url ?? null;
  const rankTheme = getRankTheme(rank);
  const rankAccent = sheetRankRow?.accent ?? rankRow?.accent ?? rankTheme.primary;
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

          <div className="relative grid grid-cols-[140px_1fr_230px] gap-4">
            {/* Character Avatar */}
            <div className="relative flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md border border-white/10">
                <CharacterPortrait
                  codename={character.codename}
                  accent={character.accent}
                  selected
                />
                <div className="pointer-events-none absolute -inset-0.5 rounded-md border border-neon/30 shadow-[0_0_25px_-6px_var(--neon)]" />
              </div>
              <div className="rounded-sm border border-white/10 bg-black/40 px-3 py-2 text-center">
                <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
                  Codename
                </div>
                <div className="mt-0.5 truncate font-display text-xs font-bold uppercase tracking-widest">
                  {character.codename}
                </div>
              </div>
            </div>

            {/* Identity + Contact */}
            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  // Digital Stoner Pass
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="min-w-0 flex-1 truncate font-display text-2xl font-black uppercase tracking-widest text-foreground">
                    {profile.playerName ?? "OPERATOR"}
                  </h1>
                  <button
                    onClick={() => {
                      setNewName("");
                      setConfirmStep(false);
                      setChangeOpen(true);
                    }}
                    className="shrink-0 rounded-sm border border-white/15 bg-black/40 p-1.5 text-muted-foreground transition-colors hover:border-neon/50 hover:text-neon"
                    aria-label="Change player name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ReadonlyField label="Pass ID" value={profile.passId ?? "—"} />
                <ReadonlyField label="Member Since" value={memberSince} />
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center gap-2 pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
                  <span className="font-display text-[11px] font-bold uppercase tracking-widest">
                    Delivery Contact
                  </span>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Auto-fills at checkout
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <BunkerInput
                    label="Phone"
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
              <div className="flex items-center gap-2.5">
                <BadgeGlow
                  src={rankBadgeImage}
                  alt={rank}
                  size={44}
                  primary={rankAccent || rankTheme.primary}
                  secondary={rankTheme.secondary}
                  intensity="md"
                />

                <div className="min-w-0">
                  <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
                    Current Rank
                  </div>
                  <div
                    className="truncate font-display text-lg font-black uppercase tracking-widest"
                    style={{ color: rankAccent }}
                  >
                    {rank}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                    Level
                  </div>
                  <div className="font-display text-lg font-black tabular-nums text-neon">
                    {stats?.level ?? 1}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-neon" /> XP
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
                <div className="mt-1 text-right font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                  {(stats?.xp ?? 0).toLocaleString()} TOTAL
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MiniStat
                  label="Gold"
                  value={(stats?.gold ?? 0).toLocaleString()}
                  valueClass="text-amber-300"
                  icon={<Coins className="h-3 w-3 text-amber-300" />}
                />
                <MiniStat
                  label="Total Purchase"
                  value={`฿${Number(stats?.total_purchase ?? 0).toLocaleString()}`}
                />
                <MiniStat
                  label="Total Weight"
                  value={`${Number(stats?.total_weight ?? 0)}G`}
                />
                <MiniStat
                  label="Status"
                  value="ACTIVE"
                  valueClass="text-neon"
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

function MiniStat({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-white/10 bg-panel-elevated/60 px-2.5 py-1.5">
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("mt-0.5 truncate font-display text-sm font-bold tabular-nums", valueClass ?? "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
