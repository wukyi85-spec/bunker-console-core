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
  editPlayerProfilePaid,
  listRanks,
} from "@/lib/bunker-supabase";
import { getRankSettings, getGameSettings } from "@/lib/sheets.functions";
import { getPlayerProfile, setPlayerProfile, CHARACTERS } from "@/lib/player";
import { useSheetCharacters, pickCharacter } from "@/lib/characters";
import { levelProgress, PROGRESSION } from "@/lib/progression";
import { Coins, Phone, MapPin, Pencil, Zap } from "lucide-react";

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
  const fetchSettings = useServerFn(getGameSettings);
  const settingsQ = useQuery({
    queryKey: ["sheet_settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
  const stats: any = statsQ.data;

  const character =
    CHARACTERS.find((c) => c.id === profile.characterId) ?? CHARACTERS[0];
  const charactersQ = useSheetCharacters();
  const sheetChar = pickCharacter(charactersQ.data, profile.characterId);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (stats && editOpen === false) {
      // keep in sync
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

  const isFirstEdit = (stats?.name_change_count ?? 0) === 0;
  const editCost = isFirstEdit ? 0 : settingsQ.data?.name_change_gold_cost ?? 100;

  function openEdit() {
    setEditName(profile.playerName ?? stats?.player_name ?? "");
    setEditPhone(stats?.phone ?? "");
    setEditAddress(stats?.default_address ?? "");
    setConfirmStep(false);
    setEditOpen(true);
  }

  const hasChanges =
    editName.trim().toUpperCase() !== (profile.playerName ?? stats?.player_name ?? "").toUpperCase() ||
    editPhone.trim() !== (stats?.phone ?? "") ||
    editAddress.trim() !== (stats?.default_address ?? "");

  async function submitEdit() {
    setConfirming(true);
    try {
      const trimmedName = editName.trim().toUpperCase();
      const updated: any = await editPlayerProfilePaid({
        newName: trimmedName,
        phone: editPhone.trim(),
        address: editAddress.trim(),
        cost: editCost,
      });
      setPlayerProfile({ playerName: updated?.player_name ?? trimmedName });
      toast.success(editCost > 0 ? `Profile updated · -${editCost} Gold` : "Profile updated");
      qc.invalidateQueries({ queryKey: ["player_stats"] });
      setEditOpen(false);
      setConfirmStep(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Update failed");
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
          className="corner-frame-lines relative overflow-hidden p-4 lphone:p-3"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, ${rankAccent}, transparent 55%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.08]" />

          <div className="relative grid grid-cols-[130px_1fr_210px] gap-3 lphone:grid-cols-[110px_1fr_180px] lphone:gap-2.5">
            {/* Character Avatar */}
            <div className="relative flex flex-col gap-2">
              <div className="relative overflow-hidden rounded-md border border-white/10 aspect-[3/4] bg-black/40">
                {sheetChar?.halfBody ? (
                  <img
                    src={sheetChar.halfBody}
                    alt={sheetChar.name}
                    draggable={false}
                    className="h-full w-full object-contain object-bottom"
                  />
                ) : (
                  <CharacterPortrait
                    codename={character.codename}
                    accent={character.accent}
                    selected
                  />
                )}
                <div className="pointer-events-none absolute -inset-0.5 rounded-md border border-neon/30 shadow-[0_0_25px_-6px_var(--neon)]" />
              </div>
              <div className="rounded-sm border border-white/10 bg-black/40 px-2 py-1.5 text-center">
                <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
                  Character
                </div>
                <div className="mt-0.5 truncate font-display text-[11px] font-bold uppercase tracking-widest">
                  {sheetChar?.name ?? "—"}
                </div>
              </div>
            </div>

            {/* Identity + Contact */}
            <div className="flex min-w-0 flex-col gap-2.5">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
                  // Digital Stoner Pass
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="min-w-0 flex-1 truncate font-display text-xl font-black uppercase tracking-widest text-foreground lphone:text-lg">
                    {profile.playerName ?? stats?.player_name ?? "OPERATOR"}
                  </h1>
                  <button
                    onClick={openEdit}
                    className="shrink-0 rounded-sm border border-white/15 bg-black/40 p-1.5 text-muted-foreground transition-colors hover:border-neon/50 hover:text-neon"
                    aria-label="Edit profile"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ReadonlyField label="Pass ID" value={profile.passId ?? "—"} />
                <ReadonlyField label="Member Since" value={memberSince} />
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="flex items-center gap-2 pb-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon animate-hud-pulse" />
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest">
                    Delivery Contact
                  </span>
                  <span className="ml-auto font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
                    Auto-fills at checkout
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ReadonlyField
                    label="Phone"
                    value={stats?.phone || "—"}
                    icon={<Phone className="h-3 w-3 text-muted-foreground" />}
                  />
                  <ReadonlyField
                    label="Address"
                    value={stats?.default_address || "—"}
                    icon={<MapPin className="h-3 w-3 text-muted-foreground" />}
                  />
                </div>
              </div>
            </div>

            {/* Rank / Stats */}
            <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/40 p-2.5">
              <div className="flex items-center gap-2">
                <BadgeGlow
                  src={rankBadgeImage}
                  alt={rank}
                  size={40}
                  primary={rankAccent || rankTheme.primary}
                  secondary={rankTheme.secondary}
                  intensity="md"
                />

                <div className="min-w-0">
                  <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
                    Rank
                  </div>
                  <div
                    className="truncate font-display text-base font-black uppercase tracking-widest"
                    style={{ color: rankAccent }}
                  >
                    {rank}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
                    Lv
                  </div>
                  <div className="font-display text-base font-black tabular-nums text-neon">
                    {stats?.level ?? 1}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-neon" /> XP
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

              <div className="grid grid-cols-2 gap-1.5">
                <MiniStat
                  label="Gold"
                  value={(stats?.gold ?? 0).toLocaleString()}
                  valueClass="text-amber-300"
                  icon={<Coins className="h-3 w-3 text-amber-300" />}
                />
                <MiniStat
                  label="Purchase"
                  value={`฿${Number(stats?.total_purchase ?? 0).toLocaleString()}`}
                />
                <MiniStat
                  label="Weight"
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

      {/* ========== Edit Profile (Paid) ========== */}
      {editOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => !confirming && setEditOpen(false)}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
          <div
            className="relative w-full max-w-md rounded-md border-2 border-neon/50 bg-panel p-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon">
              // Edit Operator Profile
            </div>
            <h2 className="mt-1 font-display text-xl font-black uppercase tracking-widest">
              Edit Digital Pass
            </h2>

            <div
              className={cn(
                "mt-3 flex items-center gap-2 rounded-sm border px-3 py-2",
                editCost === 0
                  ? "border-neon/40 bg-neon/10"
                  : "border-amber-400/40 bg-amber-400/10",
              )}
            >
              <Coins
                className={cn("h-4 w-4", editCost === 0 ? "text-neon" : "text-amber-300")}
              />
              <span
                className={cn(
                  "font-mono text-[11px] uppercase tracking-widest",
                  editCost === 0 ? "text-neon" : "text-amber-200",
                )}
              >
                {editCost === 0 ? "First edit: FREE" : `Cost: ${editCost} Gold per edit`}
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Balance: {(stats?.gold ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              <BunkerInput
                label="Player Name"
                value={editName}
                onChange={(e) =>
                  setEditName(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
                }
                placeholder="3–16 CHARACTERS · A–Z 0–9"
                maxLength={16}
                autoFocus
              />
              <BunkerInput
                label="Phone"
                icon={<Phone className="h-3.5 w-3.5" />}
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+66 ..."
                inputMode="tel"
              />
              <BunkerInput
                label="Address"
                icon={<MapPin className="h-3.5 w-3.5" />}
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Drop location"
              />
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Any change to name, phone, or address will consume{" "}
                {editCost === 0 ? "no gold (first edit)" : `${editCost} gold`}.
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
                  Back
                </BunkerButton>
                <BunkerButton
                  className="flex-1"
                  disabled={confirming}
                  onClick={submitEdit}
                >
                  {confirming
                    ? "Processing..."
                    : editCost === 0
                      ? "Confirm · FREE"
                      : `Confirm · Pay ${editCost} Gold`}
                </BunkerButton>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <BunkerButton
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </BunkerButton>
                <BunkerButton
                  className="flex-1"
                  disabled={
                    editName.trim().length < 3 ||
                    !hasChanges ||
                    (stats?.gold ?? 0) < editCost
                  }
                  onClick={() => setConfirmStep(true)}
                >
                  Continue
                </BunkerButton>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ReadonlyField({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-sm border border-white/10 bg-black/40 px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn("truncate font-display text-xs font-bold tracking-widest", valueClass ?? "text-foreground")}>
        {value}
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
    <div className="rounded-sm border border-white/10 bg-panel-elevated/60 px-2 py-1">
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("mt-0.5 truncate font-display text-xs font-bold tabular-nums", valueClass ?? "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
