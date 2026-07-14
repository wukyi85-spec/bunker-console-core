// Reward Loadout — client-side cart of redeemed physical rewards awaiting delivery.
// Rewards are paid up-front in Gold (via redeem_shop_reward). This store simply
// holds them until the player checks out a reward-type order.

const KEY = "bunker.reward-loadout";

export interface RewardLoadoutItem {
  rewardId: string;
  rewardName: string;
  image?: string;
  goldCost: number;   // What the player paid for this item
  quantity: number;   // Always 1 in current UX, but future-proofed
  redeemedAt: string; // ISO
}

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): RewardLoadoutItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: RewardLoadoutItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function getRewardLoadout(): RewardLoadoutItem[] {
  return read();
}

export function subscribeRewardLoadout(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addToRewardLoadout(item: Omit<RewardLoadoutItem, "redeemedAt" | "quantity"> & { quantity?: number }) {
  const items = read();
  items.push({
    ...item,
    quantity: item.quantity ?? 1,
    redeemedAt: new Date().toISOString(),
  });
  write(items);
}

export function removeRewardLoadoutIndex(index: number) {
  const items = read();
  items.splice(index, 1);
  write(items);
}

export function clearRewardLoadout() {
  write([]);
}

export function rewardLoadoutTotals(items: RewardLoadoutItem[]) {
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const goldSpent = items.reduce((s, i) => s + i.goldCost * i.quantity, 0);
  return { count, goldSpent };
}

// Session flag used by /checkout to know it's running a Reward order (not Supply).
const MODE_KEY = "bunker.checkout-mode";
export function setCheckoutMode(mode: "supply" | "reward") {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(MODE_KEY, mode);
}
export function getCheckoutMode(): "supply" | "reward" {
  if (typeof window === "undefined") return "supply";
  return (window.sessionStorage.getItem(MODE_KEY) as "supply" | "reward") || "supply";
}
export function clearCheckoutMode() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(MODE_KEY);
}
