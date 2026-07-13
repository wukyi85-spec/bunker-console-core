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
  const { data, error } = await supabase.rpc("admin_create_member", {
    p_admin_pass_id: s.passId,
    p_admin_password: s.password,
    p_pass_id: input.pass_id,
    p_password: input.password,
    p_rank: input.rank,
    p_status: input.status,
  });
  if (error) throw error;
  return data as MemberRow;
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
