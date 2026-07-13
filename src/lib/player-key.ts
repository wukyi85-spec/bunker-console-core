// Player identity — currently the member's pass_id (set at login).
// Falls back to a device UUID if no login yet (guest flow, never seeded).
const KEY = "bunker.player_key";

export function getPlayerKey(): string {
  if (typeof window === "undefined") return "ssr";
  let k = window.localStorage.getItem(KEY);
  if (!k) {
    k = crypto.randomUUID();
    window.localStorage.setItem(KEY, k);
  }
  return k;
}

export function setPlayerKey(k: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, k);
}

export function clearPlayerKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
