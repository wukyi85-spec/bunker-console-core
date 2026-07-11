// Device-level player identity. When auth arrives we swap to auth.uid().
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
