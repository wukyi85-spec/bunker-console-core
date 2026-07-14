// Reads all game data tabs from the BLACK'S BUNKER Google Sheet through the
// Lovable connector gateway. One server-side helper per tab.
import { createServerFn } from "@tanstack/react-start";

const SPREADSHEET_ID = "1kTOlpWLZ6HlAzV3kOOobaN-4aNuqsyFRCb4jWeTzs5M";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets";

async function fetchRange(range: string): Promise<string[][]> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey || !sheetsKey) throw new Error("Google Sheets connector not configured");
  const url = `${GATEWAY}/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Sheets fetch failed [${res.status}] range=${range}: ${body}`);
    throw new Error(`Sheets fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function bool(v: string | undefined): boolean {
  if (!v) return false;
  return ["true", "1", "yes", "y"].includes(String(v).trim().toLowerCase());
}
function str(v: string | undefined): string {
  return (v ?? "").trim();
}
function headerMap(header: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  header.forEach((h, i) => {
    m[h.trim().toLowerCase().replace(/\s+/g, "_")] = i;
  });
  return m;
}

// ---------- SETTINGS ----------
export interface GameSettings {
  minimum_order_amount: number;
  minimum_order_weight: number;
  delivery_waiting_time: string;
  voucher_max_discount: number;
  reward_delivery_free: boolean;
  rush_order_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  bunker_alarm_expire_days: number;
  weekly_mission_reset_days: number;
  special_mission_reset_days: number;
  name_change_gold_cost: number;
  max_alarm_display: number;
  member_only_mode: boolean;
  xp_per_10_thb: number;
  gold_per_10_thb: number;
  voucher_expire_days: number;
  notification_expire_days: number;
  contact_telegram_url: string;
}


export const DEFAULT_SETTINGS: GameSettings = {
  minimum_order_amount: 1000,
  minimum_order_weight: 50,
  delivery_waiting_time: "2-5",
  voucher_max_discount: 500,
  reward_delivery_free: true,
  rush_order_enabled: false,
  maintenance_mode: false,
  maintenance_message: "",
  bunker_alarm_expire_days: 3,
  weekly_mission_reset_days: 7,
  special_mission_reset_days: 15,
  name_change_gold_cost: 100,
  max_alarm_display: 3,
  member_only_mode: true,
  xp_per_10_thb: 1,
  gold_per_10_thb: 1,
  voucher_expire_days: 30,
  notification_expire_days: 3,
  contact_telegram_url: "https://t.me/blacksbunker",
};


export const getGameSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<GameSettings> => {
    const rows = await fetchRange("Settings!A1:B200");
    const map: Record<string, string> = {};
    for (let i = 1; i < rows.length; i++) {
      const [k, v] = rows[i];
      if (!k) continue;
      map[k.trim().toLowerCase().replace(/[\s-]+/g, "_")] = v ?? "";
    }
    // Sheet variants: xp_pre_10_thb / gold_pre_10_thb — accept typos.
    const xpKey = map.xp_per_10_thb ?? map.xp_pre_10_thb;
    const goldKey = map.gold_per_10_thb ?? map.gold_pre_10_thb;
    return {
      minimum_order_amount: num(map.minimum_order_amount) || DEFAULT_SETTINGS.minimum_order_amount,
      minimum_order_weight: num(map.minimum_order_weight) || DEFAULT_SETTINGS.minimum_order_weight,
      delivery_waiting_time: str(map.delivery_waiting_time) || DEFAULT_SETTINGS.delivery_waiting_time,
      voucher_max_discount: num(map.voucher_max_discount) || DEFAULT_SETTINGS.voucher_max_discount,
      reward_delivery_free: bool(map.reward_delivery_free),
      rush_order_enabled: bool(map.rush_order_enabled),
      maintenance_mode: bool(map.maintenance_mode),
      maintenance_message: str(map.maintenance_message),
      bunker_alarm_expire_days:
        num(map.bunker_alarm_expire_days) || DEFAULT_SETTINGS.bunker_alarm_expire_days,
      weekly_mission_reset_days:
        num(map.weekly_mission_reset_days) || DEFAULT_SETTINGS.weekly_mission_reset_days,
      special_mission_reset_days:
        num(map.special_mission_reset_days) || DEFAULT_SETTINGS.special_mission_reset_days,
      name_change_gold_cost:
        num(map.name_change_gold_cost) || DEFAULT_SETTINGS.name_change_gold_cost,
      max_alarm_display: num(map.max_alarm_display) || DEFAULT_SETTINGS.max_alarm_display,
      member_only_mode: bool(map.member_only_mode),
      xp_per_10_thb: num(xpKey) || DEFAULT_SETTINGS.xp_per_10_thb,
      gold_per_10_thb: num(goldKey) || DEFAULT_SETTINGS.gold_per_10_thb,
      voucher_expire_days: num(map.voucher_expire_days) || DEFAULT_SETTINGS.voucher_expire_days,
      notification_expire_days:
        num(map.notification_expire_days) || DEFAULT_SETTINGS.notification_expire_days,
    };
  },
);

// ---------- REWARDS ----------
export interface SheetReward {
  id: string;
  name: string;
  image: string;
  goldCost: number;
  type: "physical" | "voucher";
  stockLabel: string;
  inStock: boolean;
  active: boolean;
}

export const getSheetRewards = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetReward[]> => {
    const rows = await fetchRange("rewards!A1:Z200");
    if (rows.length < 2) return [];
    const h = headerMap(rows[0]);
    const out: SheetReward[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const id = str(row[h.id]);
      const name = str(row[h.reward_name]);
      if (!id || !name) continue;
      const stockLabel = str(row[h.stock]);
      const typeRaw = str(row[h.type]).toLowerCase();
      out.push({
        id,
        name,
        image: str(row[h.image]),
        goldCost: num(row[h.gold_cost]),
        type: typeRaw === "voucher" ? "voucher" : "physical",
        stockLabel,
        inStock: !stockLabel.toLowerCase().includes("out"),
        active: bool(row[h.active]),
      });
    }
    return out.filter((r) => r.active);
  },
);

// ---------- PAYMENT QR ----------
export interface SheetPaymentQR {
  method: string;
  qrImage: string;
  active: boolean;
}

export const getPaymentQRs = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetPaymentQR[]> => {
    // Sheet tab is "PaymentQR". Fall back to legacy "payment qr" if needed.
    let rows: string[][] = [];
    try {
      rows = await fetchRange("PaymentQR!A1:Z100");
    } catch (e) {
      console.warn("[PaymentQR] Primary tab failed, trying legacy 'payment qr'", e);
      rows = await fetchRange("'payment qr'!A1:Z100");
    }
    if (rows.length < 2) return [];
    const h = headerMap(rows[0]);
    const out: SheetPaymentQR[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const method = str(row[h.payment_method]);
      if (!method) continue;
      // Only method + QR image are exposed. Account numbers are ignored.
      out.push({
        method,
        qrImage: str(row[h.qr_image]),
        active: bool(row[h.active]),
      });
    }
    const active = out.filter((p) => p.active);
    console.log(`[PaymentQR] Loaded ${active.length} active methods:`, active.map((p) => p.method));
    return active;
  },
);

// ---------- MISSIONS ----------
export type MissionMetric = "weight" | "spend" | "order";
export interface SheetMission {
  id: string;
  category: "weekly" | "special";
  metric: MissionMetric;
  mission: string;
  requirement: number;
  rewardXp: number;
  rewardGold: number;
  active: boolean;
}

function parseMissionRow(row: string[], h: Record<string, number>): Omit<SheetMission, "category"> | null {
  const id = str(row[h.id]);
  const mission = str(row[h.mission]);
  if (!id || !mission) return null;
  const typeRaw = str(row[h.type]).toLowerCase();
  const metric: MissionMetric =
    typeRaw === "weight" ? "weight" : typeRaw === "spend" ? "spend" : "order";
  return {
    id,
    metric,
    mission,
    requirement: num(row[h.requirement]),
    rewardXp: num(row[h.reward_xp]),
    rewardGold: num(row[h.reward_gold]),
    active: bool(row[h.active]),
  };
}

export const getWeeklyMissions = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetMission[]> => {
    const rows = await fetchRange("weeklymission!A1:Z200");
    if (rows.length < 2) return [];
    const h = headerMap(rows[0]);
    const out: SheetMission[] = [];
    for (let i = 1; i < rows.length; i++) {
      const parsed = parseMissionRow(rows[i], h);
      if (parsed && parsed.active) out.push({ ...parsed, category: "weekly" });
    }
    return out;
  },
);

export const getSpecialMissions = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetMission[]> => {
    const rows = await fetchRange("specialMission!A1:Z200");
    if (rows.length < 2) return [];
    const h = headerMap(rows[0]);
    const out: SheetMission[] = [];
    for (let i = 1; i < rows.length; i++) {
      const parsed = parseMissionRow(rows[i], h);
      if (parsed && parsed.active) out.push({ ...parsed, category: "special" });
    }
    return out;
  },
);

// ---------- RANK SETTINGS ----------
export interface SheetRank {
  name: string;
  minXp: number;
  maxXp: number;
  badgeImage: string;
}

export const getRankSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetRank[]> => {
    const rows = await fetchRange("RankSetting!A1:Z200");
    if (rows.length < 2) return [];
    const h = headerMap(rows[0]);
    const out: SheetRank[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = str(row[h.rank]);
      if (!name) continue;
      out.push({
        name: name.replace(/\s+/g, " ").trim().toUpperCase(),
        minXp: num(row[h.min_xp]),
        maxXp: num(row[h.max_xp]) || Infinity,
        badgeImage: str(row[h.badge_image_url]),
      });
    }
    return out.sort((a, b) => a.minXp - b.minXp);
  },
);

// ---------- ANNOUNCEMENTS ----------
export interface SheetAnnouncement {
  title: string;
  message: string;
  type: string;
  active: boolean;
  createdAt?: string;
}

export const getAnnouncements = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetAnnouncement[]> => {
    const rows = await fetchRange("Announcements!A1:Z200");
    if (rows.length < 2) return [];
    const h = headerMap(rows[0]);
    const out: SheetAnnouncement[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const title = str(row[h.title]);
      const message = str(row[h.message]);
      if (!title && !message) continue;
      out.push({
        title,
        message,
        type: str(row[h.type]) || "intel",
        active: h.active !== undefined ? bool(row[h.active]) : true,
        createdAt: h.created_at !== undefined ? str(row[h.created_at]) : undefined,
      });
    }
    return out.filter((a) => a.active);
  },
);
