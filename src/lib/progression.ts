// Progression tuning — change these values to rebalance the game.
export const PROGRESSION = {
  // 1000 THB → 100 XP, 50 Gold
  xpPerBaht: 0.1,
  goldPerBaht: 0.05,
  // Level curve: 100 XP per level
  xpPerLevel: 100,
  // Activity: bumped by 20 per order, decays 1/hour idle
  activityPerOrder: 20,
  activityDecayPerHour: 1,
  activityMax: 100,
  activityCap: 100,
} as const;

export function calcXp(baht: number) {
  return Math.round(baht * PROGRESSION.xpPerBaht);
}
export function calcGold(baht: number) {
  return Math.round(baht * PROGRESSION.goldPerBaht);
}
export function calcLevel(xp: number) {
  return Math.max(1, Math.floor(xp / PROGRESSION.xpPerLevel) + 1);
}
export function levelProgress(xp: number) {
  const within = xp % PROGRESSION.xpPerLevel;
  return Math.round((within / PROGRESSION.xpPerLevel) * 100);
}
