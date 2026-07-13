// Placeholder player profile store — future-ready for Supabase.
// Swap the localStorage layer for a `profiles` table read/write when auth is wired.

const STORAGE_KEY = "bunker.player";

export interface PlayerProfile {
  memberId: string | null;
  passId: string | null;
  characterId: string | null;
  playerName: string | null;
  firstLoginCompleted: boolean;
}

const DEFAULT_PROFILE: PlayerProfile = {
  memberId: null,
  passId: null,
  characterId: null,
  playerName: null,
  firstLoginCompleted: false,
};

export function getPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function setPlayerProfile(patch: Partial<PlayerProfile>) {
  if (typeof window === "undefined") return;
  const next = { ...getPlayerProfile(), ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function resetPlayerProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const CHARACTERS = [
  { id: "char-01", label: "Character 01", codename: "Ghost", accent: "#7CFF4D" },
  { id: "char-02", label: "Character 02", codename: "Reaper", accent: "#4DE0FF" },
  { id: "char-03", label: "Character 03", codename: "Wraith", accent: "#FF6A4D" },
] as const;

export type CharacterId = (typeof CHARACTERS)[number]["id"];
