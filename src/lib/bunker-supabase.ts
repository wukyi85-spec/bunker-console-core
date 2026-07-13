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
  // XP + Gold are awarded ONLY on delivery (admin_mark_order_delivered).
  // Persist 0 here so client-side displays reflect the not-yet-earned state.
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
    xp_earned: 0,
    gold_earned: 0,
  };

  const { data, error } = await supabase.rpc("create_player_order", {
    payload: orderPayload as never,
  });
  if (error) {
    console.error("[BLACK'S BUNKER] Order insert failed:", error);
    throw error;
  }

  // Progress totals + activity only. XP/Gold reserved for delivery.
  await bumpPlayerStats({ xp: 0, gold: 0, productTotal: p.productTotal, totalGrams: p.totalGrams });
  const missionRewards = await bumpMissions({
    grams: p.totalGrams,
    thb: p.productTotal,
    orders: 1,
  });

  return { order: data, missionRewards };
}


export async function listOrders() {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase.rpc("list_player_orders", { p_player_key: playerKey });
  if (error) throw error;
  return (data as any[]) ?? [];
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

export async function updatePlayerProfileInfo(input: {
  fullName: string;
  phone: string;
  defaultAddress: string;
}) {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase.rpc("update_player_profile_info" as never, {
    p_player_key: playerKey,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_default_address: input.defaultAddress,
  } as never);
  if (error) throw error;
  return data;
}

export async function changePlayerName(newName: string) {
  const playerKey = getPlayerKey();
  const profile = getPlayerProfile();
  const { data, error } = await supabase.rpc("change_player_name" as never, {
    p_player_key: playerKey,
    p_new_name: newName,
    p_member_id: profile.memberId,
  } as never);
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
    supabase.rpc("list_player_missions", { p_player_key: playerKey }),
  ]);
  if (missionsRes.error) throw missionsRes.error;
  if (progressRes.error) throw progressRes.error;
  const progressMap = new Map(
    ((progressRes.data as any[]) ?? []).map((p: any) => [p.mission_id, p]),
  );
  return (missionsRes.data ?? []).map((m) => {
    const p: any = progressMap.get(m.id);
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
    const completedAt = isComplete ? new Date().toISOString() : null;
    await supabase.rpc("upsert_player_mission", {
      p_player_key: playerKey,
      p_mission_id: m.id,
      p_progress: Math.min(nextProgress, m.target_value),
      p_completed_at: completedAt as unknown as string,
    });
    if (isComplete) {
      completed.push({ ...m, progress: m.target_value, completed_at: new Date().toISOString() });
      // Grant XP + Gold
      const current = await getPlayerStats();
      if (current) {
        await supabase.rpc("add_player_stats_rewards", {
          p_player_key: playerKey,
          p_xp: m.xp_reward,
          p_gold: m.gold_reward,
          p_level: calcLevel(current.xp + m.xp_reward),
        });
      }
      // Grant reward
      if (m.reward_id) {
        await supabase.rpc("insert_player_reward", {
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
  const { data, error } = await supabase.rpc("list_player_rewards", { p_player_key: playerKey });
  if (error) throw error;
  return ((data as unknown as PlayerRewardRow[]) ?? []);
}

export async function claimReward(playerRewardId: string) {
  const playerKey = getPlayerKey();
  const { error } = await supabase.rpc("claim_player_reward", {
    p_id: playerRewardId,
    p_player_key: playerKey,
  });
  if (error) throw error;
}

// ---------- NOTIFICATIONS ----------
export interface PlayerNotificationRow {
  id: string;
  player_key: string;
  type: string;
  title: string;
  message: string;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
}

export async function listPlayerNotifications(): Promise<PlayerNotificationRow[]> {
  const playerKey = getPlayerKey();
  const { data, error } = await supabase.rpc("list_player_notifications" as never, {
    p_player_key: playerKey,
  } as never);
  if (error) throw error;
  return ((data ?? []) as unknown) as PlayerNotificationRow[];
}

export async function markNotificationRead(id: string) {
  const playerKey = getPlayerKey();
  const { error } = await supabase.rpc("mark_notification_read" as never, {
    p_id: id,
    p_player_key: playerKey,
  } as never);
  if (error) throw error;
}

// ---------- STATUS LABELS ----------
export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    waiting_payment: "WAITING PAYMENT",
    pending: "WAITING PAYMENT",
    confirmed: "CONFIRMED",
    processing: "PROCESSING",
    packing: "PACKING",
    out_for_delivery: "OUT FOR DELIVERY",
    delivered: "OUT FOR DELIVERY",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
  return map[status?.toLowerCase?.()] ?? (status || "").toUpperCase();
}


