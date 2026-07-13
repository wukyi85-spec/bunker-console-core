import { supabase } from "@/integrations/supabase/client";
import { getPlayerKey } from "./player-key";
import { getPlayerProfile } from "./player";
import type { LoadoutItem } from "./loadout";
import { PROGRESSION, calcGold, calcLevel, calcXp } from "./progression";

export interface OrderInsertPayload {
  items: LoadoutItem[];
  customer: { name: string; phone: string; address: string; notes?: string };
  payment: "PromptPay" | "KPay" | "WavePay";
  productTotal: number;
  totalGrams: number;
}

export function calcRewards(productTotal: number) {
  return { xp: calcXp(productTotal), gold: calcGold(productTotal) };
}

function newMissionNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `OP-${t}-${r}`;
}

// ---------- MEMBERS ----------
export async function loginMember(passId: string, password: string) {
  const { data, error } = await supabase.rpc("login_member", {
    p_pass_id: passId,
    p_password: password,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.member_id as string,
    passId: row.pass_id as string,
    playerName: (row.player_name as string | null) ?? null,
    characterId: (row.character_id as string | null) ?? null,
    role: (row.role as string) ?? "member",
    status: (row.status as string) ?? "active",
  };
}

// ---------- ORDERS ----------
export async function createOrder(p: OrderInsertPayload) {
  const playerKey = getPlayerKey();
  const profile = getPlayerProfile();
  const xp = Math.floor(p.productTotal / 10);
  const gold = Math.floor(p.productTotal / 20);
  const mission_number = newMissionNumber();

  const orderPayload = {
    mission_number,
    player_key: playerKey,
    member_id: profile.memberId,
    pass_id: profile.passId,
    player_name: profile.playerName,
    character_id: profile.characterId,
    items: p.items as unknown as never,
    order_items: p.items as unknown as never,
    customer_name: p.customer.name,
    phone: p.customer.phone,
    address: p.customer.address,
    notes: p.customer.notes ?? null,
    payment_method: p.payment,
    total_grams: p.totalGrams,
    product_total: p.productTotal,
    total_price: p.productTotal,
    grand_total: p.productTotal,
    status: "waiting_payment",
    xp_earned: xp,
    gold_earned: gold,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();
  if (error) {
    console.error("[BLACK'S BUNKER] Order insert failed:", error);
    throw error;
  }

  await bumpPlayerStats({ xp, gold, productTotal: p.productTotal, totalGrams: p.totalGrams });
  const missionRewards = await bumpMissions({
    grams: p.totalGrams,
    thb: p.productTotal,
    orders: 1,
  });

  return { order: data, missionRewards };
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

// ---------- PLAYER STATS ----------
// All player_stats reads/writes go through SECURITY DEFINER RPCs so RLS does
// not block the pass_id-authenticated (non auth.uid) member session.
export async function getPlayerStats() {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase.rpc("get_player_stats", { p_player_key: playerKey });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

export async function ensurePlayerStats() {
  const playerKey = getPlayerKey();
  const profile = getPlayerProfile();
  const existing = await getPlayerStats();
  if (existing) return existing;
  const payload = {
    player_key: playerKey,
    player_name: profile.playerName,
    character_id: profile.characterId,
    xp: 0,
    gold: 0,
    level: 1,
    activity: 50,
    current_rank: "ROOKIE",
    total_purchase: 0,
    total_weight: 0,
  };
  const { data, error } = await supabase.rpc("upsert_player_stats", { payload: payload as never });
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
  const activity = Math.min(
    PROGRESSION.activityMax,
    (current?.activity ?? 50) + PROGRESSION.activityPerOrder,
  );
  const level = calcLevel(xp);
  const ranks = await listRanks();
  const rank = ranks.find((r) => xp >= r.min_xp && (r.max_xp == null || xp <= r.max_xp));

  const { error } = await supabase.rpc("upsert_player_stats", {
    payload: {
      player_key: playerKey,
      player_name: profile.playerName,
      character_id: profile.characterId,
      xp,
      gold,
      level,
      activity,
      current_rank: rank?.name ?? "ROOKIE",
      total_purchase,
      total_weight,
    } as never,
  });
  if (error) throw error;
}

// Activity decay — call on dashboard mount.
export async function decayActivityIfNeeded() {
  const stats = await getPlayerStats();
  if (!stats) return;
  const last = new Date(stats.updated_at).getTime();
  const hours = (Date.now() - last) / 3_600_000;
  if (hours < 1) return;
  const decay = Math.floor(hours * PROGRESSION.activityDecayPerHour);
  if (decay <= 0) return;
  const activity = Math.max(0, stats.activity - decay);
  await supabase.rpc("set_player_activity", {
    p_player_key: stats.player_key,
    p_activity: activity,
  });
}

// ---------- RANKS ----------
export async function listRanks() {
  const { data, error } = await supabase
    .from("ranks")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------- MISSIONS ----------
export interface MissionWithProgress {
  id: string;
  code: string;
  title: string;
  description: string | null;
  mission_type: string;
  metric: string;
  target_value: number;
  xp_reward: number;
  gold_reward: number;
  reward_id: string | null;
  display_order: number;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
}

export async function listMissions(): Promise<MissionWithProgress[]> {
  const playerKey = getPlayerKey();
  const [missionsRes, progressRes] = await Promise.all([
    supabase.from("missions").select("*").eq("active", true).order("display_order"),
    supabase.from("player_missions").select("*").eq("player_key", playerKey),
  ]);
  if (missionsRes.error) throw missionsRes.error;
  if (progressRes.error) throw progressRes.error;
  const progressMap = new Map((progressRes.data ?? []).map((p) => [p.mission_id, p]));
  return (missionsRes.data ?? []).map((m) => {
    const p = progressMap.get(m.id);
    return {
      id: m.id,
      code: m.code,
      title: m.title,
      description: m.description,
      mission_type: m.mission_type,
      metric: m.metric,
      target_value: Number(m.target_value),
      xp_reward: m.xp_reward,
      gold_reward: m.gold_reward,
      reward_id: m.reward_id,
      display_order: m.display_order,
      progress: Number(p?.progress ?? 0),
      completed_at: p?.completed_at ?? null,
      claimed_at: p?.claimed_at ?? null,
    };
  });
}

async function bumpMissions(delta: { grams: number; thb: number; orders: number }) {
  const playerKey = getPlayerKey();
  const missions = await listMissions();
  const completed: MissionWithProgress[] = [];

  for (const m of missions) {
    if (m.completed_at) continue;
    const inc =
      m.metric === "grams" ? delta.grams : m.metric === "thb" ? delta.thb : delta.orders;
    if (inc <= 0) continue;
    const nextProgress = m.progress + inc;
    const isComplete = nextProgress >= m.target_value;
    await supabase.from("player_missions").upsert({
      player_key: playerKey,
      mission_id: m.id,
      progress: Math.min(nextProgress, m.target_value),
      completed_at: isComplete ? new Date().toISOString() : null,
    });
    if (isComplete) {
      completed.push({ ...m, progress: m.target_value, completed_at: new Date().toISOString() });
      // Grant XP + Gold
      const current = await getPlayerStats();
      if (current) {
        await supabase
          .from("player_stats")
          .update({
            xp: current.xp + m.xp_reward,
            gold: current.gold + m.gold_reward,
            level: calcLevel(current.xp + m.xp_reward),
          })
          .eq("player_key", playerKey);
      }
      // Grant reward
      if (m.reward_id) {
        await supabase.from("player_rewards").insert({
          player_key: playerKey,
          reward_id: m.reward_id,
          source: m.id,
        });
      }
    }
  }
  return completed;
}

// ---------- REWARDS ----------
export interface PlayerRewardRow {
  id: string;
  reward_id: string;
  earned_at: string;
  claimed_at: string | null;
  source: string | null;
  reward: {
    id: string;
    name: string;
    reward_type: string;
    description: string | null;
    icon: string | null;
  };
}

export async function listRewardsCatalog() {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("active", true)
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function listPlayerRewards() {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase
    .from("player_rewards")
    .select("*, reward:rewards(*)")
    .eq("player_key", playerKey)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlayerRewardRow[];
}

export async function claimReward(playerRewardId: string) {
  const { error } = await supabase
    .from("player_rewards")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", playerRewardId);
  if (error) throw error;
}
