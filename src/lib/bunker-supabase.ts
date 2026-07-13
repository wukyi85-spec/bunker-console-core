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

// Loose RPC helper — bypasses generated types for our custom SECURITY DEFINER fns.
const rpc = supabase.rpc as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: unknown }>;

async function callRpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(fn, args);
  if (error) {
    console.error(`[BLACK'S BUNKER] ${fn} RPC error:`, error);
    throw error;
  }
  return data as T;
}

// ---------- MEMBERS ----------
export async function loginMember(passId: string, password: string) {
  const data = await callRpc<unknown>("login_member", {
    p_pass_id: passId.trim(),
    p_password: password,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const r = row as Record<string, unknown>;
  const id = (r.member_id ?? r.id) as string | undefined;
  const pid = (r.pass_id ?? passId) as string;
  if (!id) return null;
  return {
    id,
    passId: pid,
    playerName: (r.player_name ?? null) as string | null,
    characterId: (r.character_id ?? null) as string | null,
  };
}

// ---------- ORDERS ----------
export async function createOrder(p: OrderInsertPayload) {
  const playerKey = getPlayerKey();
  const profile = getPlayerProfile();
  const xp = Math.floor(p.productTotal / 10);
  const gold = Math.floor(p.productTotal / 20);
  const mission_number = newMissionNumber();

  const payload = {
    mission_number,
    player_key: playerKey,
    member_id: profile.memberId ?? "",
    pass_id: profile.passId,
    player_name: profile.playerName,
    character_id: profile.characterId,
    items: p.items,
    order_items: p.items,
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

  const data = await callRpc<OrderRecord>("create_player_order", { payload });

  await bumpPlayerStats({ xp, gold, productTotal: p.productTotal, totalGrams: p.totalGrams });
  const missionRewards = await bumpMissions({
    grams: p.totalGrams,
    thb: p.productTotal,
    orders: 1,
  });

  return { order: data, missionRewards };
}

export interface OrderRecord {
  id: string;
  mission_number: string;
  created_at: string;
  items: unknown;
  order_items?: unknown;
  customer_name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  payment_method: string;
  total_grams: number;
  product_total: number;
  grand_total: number;
  status: string;
  xp_earned: number | null;
  gold_earned: number | null;
  player_key: string;
  player_name: string | null;
  character_id: string | null;
}

export async function listOrders(): Promise<OrderRecord[]> {
  const playerKey = getPlayerKey();
  const data = await callRpc<OrderRecord[] | null>("list_player_orders", {
    p_player_key: playerKey,
  });
  return data ?? [];
}

// ---------- PLAYER STATS ----------
type PlayerStatsRow = {
  player_key: string;
  player_name: string | null;
  character_id: string | null;
  xp: number;
  gold: number;
  level: number;
  activity: number;
  current_rank: string;
  total_purchase: number;
  total_weight: number;
  updated_at: string;
};

export async function getPlayerStats(): Promise<PlayerStatsRow | null> {
  const playerKey = getPlayerKey();
  const data = await callRpc<PlayerStatsRow | null>("get_player_stats", {
    p_player_key: playerKey,
  });
  return data ?? null;
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
  return await callRpc<PlayerStatsRow>("upsert_player_stats", { payload });
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

  const payload = {
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
  };
  await callRpc("upsert_player_stats", { payload });
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
  await callRpc("set_player_activity", { p_player_key: stats.player_key, p_activity: activity });
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
  const [missionsRes, progressData] = await Promise.all([
    supabase.from("missions").select("*").eq("active", true).order("display_order"),
    callRpc<Array<{ mission_id: string; progress: number; completed_at: string | null; claimed_at: string | null }>>(
      "list_player_missions",
      { p_player_key: playerKey },
    ),
  ]);
  if (missionsRes.error) throw missionsRes.error;
  const progressMap = new Map((progressData ?? []).map((p) => [p.mission_id, p]));
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
    await callRpc("upsert_player_mission", {
      p_player_key: playerKey,
      p_mission_id: m.id,
      p_progress: Math.min(nextProgress, m.target_value),
      p_completed_at: isComplete ? new Date().toISOString() : null,
    });
    if (isComplete) {
      completed.push({ ...m, progress: m.target_value, completed_at: new Date().toISOString() });
      const current = await getPlayerStats();
      if (current) {
        const newXp = current.xp + m.xp_reward;
        await callRpc("add_player_stats_rewards", {
          p_player_key: playerKey,
          p_xp: m.xp_reward,
          p_gold: m.gold_reward,
          p_level: calcLevel(newXp),
        });
      }
      if (m.reward_id) {
        await callRpc("insert_player_reward", {
          p_player_key: playerKey,
          p_reward_id: m.reward_id,
          p_source: m.id,
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
  const data = await callRpc<PlayerRewardRow[] | null>("list_player_rewards", {
    p_player_key: playerKey,
  });
  return (data ?? []) as PlayerRewardRow[];
}

export async function claimReward(playerRewardId: string) {
  const playerKey = getPlayerKey();
  await callRpc("claim_player_reward", { p_id: playerRewardId, p_player_key: playerKey });
}
