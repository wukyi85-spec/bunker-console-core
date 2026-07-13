import { supabase } from "@/integrations/supabase/client";
import { getAdminSession } from "./admin-session";

export interface MemberRow {
  id: string;
  pass_id: string;
  password: string;
  player_name: string | null;
  character_id: string | null;
  role: string;
  status: string;
  rank: string;
  xp: number;
  gold: number;
  activity: number;
  stars: number;
  total_purchase: number;
  created_at: string;
  updated_at: string;
}

function requireAdmin() {
  const s = getAdminSession();
  if (!s) throw new Error("Not signed in as admin");
  return s;
}

export async function adminListMembers(): Promise<MemberRow[]> {
  const s = requireAdmin();
  const { data, error } = await supabase.rpc("admin_list_members", {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
  });
  if (error) throw error;
  return (data ?? []) as MemberRow[];
}

export async function adminCreateMember(input: {
  pass_id: string;
  password: string;
  rank: string;
  status: string;
}): Promise<MemberRow> {
  const s = requireAdmin();
  const cleanPassId = input.pass_id.trim().toUpperCase();
  const cleanPassword = input.password.trim();
  const { data, error } = await supabase.rpc("admin_create_member", {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_pass_id: cleanPassId,
    p_password: cleanPassword,
    p_rank: input.rank,
    p_status: input.status,
  });
  if (error) {
    console.error("[ADMIN CREATE] insert failed:", error);
    throw error;
  }
  // Post-insert verification: re-query members and confirm the row exists.
  const { data: verifyRows, error: verifyErr } = await supabase.rpc("admin_list_members", {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
  });
  if (verifyErr) {
    console.error("[ADMIN CREATE] verify query failed:", verifyErr);
    throw verifyErr;
  }
  const found = (verifyRows as MemberRow[] | null)?.find(
    (m) => m.pass_id === cleanPassId,
  );
  if (!found) {
    throw new Error("Member insert did not persist. Please try again.");
  }
  return (data as MemberRow) ?? found;
}

export type MemberUpdates = Partial<
  Pick<
    MemberRow,
    | "password"
    | "player_name"
    | "character_id"
    | "role"
    | "status"
    | "rank"
    | "xp"
    | "gold"
    | "activity"
    | "stars"
    | "total_purchase"
  >
>;

export async function adminUpdateMember(
  memberId: string,
  updates: MemberUpdates,
): Promise<MemberRow> {
  const s = requireAdmin();
  const { data, error } = await supabase.rpc("admin_update_member", {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_member_id: memberId,
    p_updates: updates as unknown as never,
  });
  if (error) throw error;
  return data as MemberRow;
}

export async function adminSuspendMember(memberId: string): Promise<MemberRow> {
  return adminUpdateMember(memberId, { status: "suspended" });
}

export async function adminDeleteMember(memberId: string): Promise<void> {
  const s = requireAdmin();
  const { error } = await supabase.rpc("admin_delete_member", {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_member_id: memberId,
  });
  if (error) {
    console.error("[ADMIN DELETE] failed:", error);
    throw error;
  }
}

// ---------- ORDERS ----------
export interface AdminOrderRow {
  id: string;
  mission_number: string;
  player_key: string;
  pass_id: string | null;
  player_name: string | null;
  character_id: string | null;
  member_id: string | null;
  items: unknown;
  order_items: unknown;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  payment_method: string;
  total_grams: number;
  product_total: number;
  total_price: number | null;
  grand_total: number;
  status: string;
  xp_earned: number;
  gold_earned: number;
  confirmed_at: string | null;
  confirmed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  tracking_url: string | null;
  delivery_fee: number | null;
  completed_at: string | null;
  rewards_awarded_at: string | null;
  created_at: string;
  updated_at: string;
}


export async function adminListOrders(): Promise<AdminOrderRow[]> {
  const s = requireAdmin();
  const { data, error } = await supabase.rpc("admin_list_orders" as never, {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
  } as never);
  if (error) throw error;
  return ((data ?? []) as unknown) as AdminOrderRow[];
}

export async function adminConfirmOrder(orderId: string): Promise<AdminOrderRow> {
  const s = requireAdmin();
  const { data, error } = await supabase.rpc("admin_confirm_order" as never, {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_order_id: orderId,
  } as never);
  if (error) {
    console.error("[ADMIN CONFIRM ORDER] failed:", error);
    throw error;
  }
  return data as unknown as AdminOrderRow;
}

export async function adminCancelOrder(orderId: string, reason: string): Promise<AdminOrderRow> {
  const s = requireAdmin();
  const { data, error } = await supabase.rpc("admin_cancel_order" as never, {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_order_id: orderId,
    p_reason: reason,
  } as never);
  if (error) {
    console.error("[ADMIN CANCEL ORDER] failed:", error);
    throw error;
  }
  return data as unknown as AdminOrderRow;
}

export async function adminSetOrderTracking(orderId: string, url: string): Promise<AdminOrderRow> {
  const s = requireAdmin();
  const { data, error } = await supabase.rpc("admin_set_order_tracking" as never, {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_order_id: orderId,
    p_url: url,
  } as never);
  if (error) throw error;
  return data as unknown as AdminOrderRow;
}

export async function adminDeleteOrder(orderId: string): Promise<void> {
  const s = requireAdmin();
  const { error } = await supabase.rpc("admin_delete_order" as never, {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_order_id: orderId,
  } as never);
  if (error) throw error;
}



