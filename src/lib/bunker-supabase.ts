import { supabase } from "@/integrations/supabase/client";
import { getPlayerKey } from "./player-key";
import { getPlayerProfile } from "./player";
import type { LoadoutItem } from "./loadout";

export interface OrderInsertPayload {
  items: LoadoutItem[];
  customer: { name: string; phone: string; address: string; notes?: string };
  payment: "PromptPay" | "KPay" | "WavePay";
  productTotal: number;
  totalGrams: number;
}

// XP/Gold economy (frontend-computed for the demo; move to a DB trigger later).
export function calcRewards(productTotal: number, totalGrams: number) {
  const xp = Math.round(productTotal / 10 + totalGrams * 5);
  const gold = Math.round(productTotal / 50 + totalGrams * 2);
  return { xp, gold };
}

function newMissionNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `OP-${t}-${r}`;
}

export async function createOrder(p: OrderInsertPayload) {
  const playerKey = getPlayerKey();
  const profile = getPlayerProfile();
  const { xp, gold } = calcRewards(p.productTotal, p.totalGrams);
  const mission_number = newMissionNumber();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      mission_number,
      player_key: playerKey,
      player_name: profile.playerName,
      character_id: profile.characterId,
      items: p.items as unknown as never,
      customer_name: p.customer.name,
      phone: p.customer.phone,
      address: p.customer.address,
      notes: p.customer.notes ?? null,
      payment_method: p.payment,
      total_grams: p.totalGrams,
      product_total: p.productTotal,
      grand_total: p.productTotal,
      status: "Processing",
      xp_earned: xp,
      gold_earned: gold,
    })
    .select()
    .single();

  if (error) throw error;

  // Upsert player_stats (add xp/gold/purchases).
  await bumpPlayerStats({
    xp,
    gold,
    productTotal: p.productTotal,
    totalGrams: p.totalGrams,
  });

  return data;
}

export async function listOrders() {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("player_key", playerKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPlayerStats() {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_key", playerKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function bumpPlayerStats(delta: {
  xp: number;
  gold: number;
  productTotal: number;
  totalGrams: number;
}) {
  const playerKey = getPlayerKey();
  const profile = getPlayerProfile();
  const current = await getPlayerStats();
  const xp = (current?.xp ?? 0) + delta.xp;
  const gold = (current?.gold ?? 0) + delta.gold;
  const total_purchase = Number(current?.total_purchase ?? 0) + delta.productTotal;
  const total_weight = Number(current?.total_weight ?? 0) + delta.totalGrams;
  const activity = (current?.activity ?? 0) + 1;
  const level = Math.max(1, Math.floor(xp / 1000) + 1);

  // Determine rank from ranks table
  const ranks = await listRanks();
  const rank = ranks.find(
    (r) => xp >= r.min_xp && (r.max_xp == null || xp <= r.max_xp),
  );

  const row = {
    player_key: playerKey,
    player_name: profile.playerName,
    character_id: profile.characterId,
    xp,
    gold,
    level,
    activity,
    current_rank: rank?.name ?? "Rookie",
    total_purchase,
    total_weight,
  };

  const { error } = await supabase.from("player_stats").upsert(row);
  if (error) throw error;
}

export async function listRanks() {
  const { data, error } = await supabase
    .from("ranks")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
