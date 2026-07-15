CREATE OR REPLACE FUNCTION public.admin_update_member(p_admin_pass_id text, p_admin_password text, p_member_id uuid, p_updates jsonb)
 RETURNS members
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_row public.members;
  v_key text;
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.members SET
    password       = COALESCE(NULLIF(p_updates->>'password',''), password),
    player_name    = CASE WHEN p_updates ? 'player_name' THEN NULLIF(p_updates->>'player_name','') ELSE player_name END,
    character_id   = CASE WHEN p_updates ? 'character_id' THEN NULLIF(p_updates->>'character_id','') ELSE character_id END,
    role           = COALESCE(p_updates->>'role', role),
    status         = COALESCE(p_updates->>'status', status),
    rank           = COALESCE(p_updates->>'rank', rank),
    xp             = COALESCE((p_updates->>'xp')::int, xp),
    gold           = COALESCE((p_updates->>'gold')::int, gold),
    activity       = COALESCE((p_updates->>'activity')::int, activity),
    stars          = COALESCE((p_updates->>'stars')::int, stars),
    total_purchase = COALESCE((p_updates->>'total_purchase')::numeric, total_purchase),
    updated_at     = now()
  WHERE id = p_member_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Sync to player_stats so the customer Dashboard reflects admin edits immediately.
  v_key := upper(btrim(updated_row.pass_id));

  INSERT INTO public.player_stats (
    player_key, player_name, character_id, xp, gold, level, activity,
    current_rank, total_purchase, total_weight
  ) VALUES (
    v_key,
    updated_row.player_name,
    updated_row.character_id,
    COALESCE(updated_row.xp, 0),
    COALESCE(updated_row.gold, 0),
    GREATEST(1, (COALESCE(updated_row.xp,0) / 100) + 1),
    COALESCE(updated_row.activity, 50),
    COALESCE(updated_row.rank, 'ROOKIE'),
    COALESCE(updated_row.total_purchase, 0),
    0
  )
  ON CONFLICT (player_key) DO UPDATE SET
    player_name    = COALESCE(EXCLUDED.player_name, public.player_stats.player_name),
    character_id   = COALESCE(EXCLUDED.character_id, public.player_stats.character_id),
    xp             = EXCLUDED.xp,
    gold           = EXCLUDED.gold,
    level          = GREATEST(1, (EXCLUDED.xp / 100) + 1),
    activity       = EXCLUDED.activity,
    current_rank   = EXCLUDED.current_rank,
    total_purchase = EXCLUDED.total_purchase,
    updated_at     = now();

  RETURN updated_row;
END;
$function$;