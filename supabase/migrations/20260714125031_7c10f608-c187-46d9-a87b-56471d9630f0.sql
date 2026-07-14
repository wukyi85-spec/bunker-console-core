
CREATE OR REPLACE FUNCTION public.edit_player_profile_paid(
  p_player_key text,
  p_new_name text,
  p_phone text,
  p_address text,
  p_member_id uuid,
  p_cost int
) RETURNS public.player_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.player_stats;
  v_clean text := upper(regexp_replace(coalesce(p_new_name,''), '[^A-Za-z0-9]', '', 'g'));
  v_changed boolean := false;
  v_cost int;
BEGIN
  IF length(v_clean) < 3 OR length(v_clean) > 16 THEN
    RAISE EXCEPTION 'Player name must be 3-16 letters or numbers';
  END IF;

  SELECT * INTO v_row FROM public.player_stats WHERE player_key = p_player_key;
  IF v_row.player_key IS NULL THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;

  IF v_clean <> coalesce(v_row.player_name,'')
     OR coalesce(p_phone,'') <> coalesce(v_row.phone,'')
     OR coalesce(p_address,'') <> coalesce(v_row.default_address,'') THEN
    v_changed := true;
  END IF;

  -- First edit is free, subsequent edits cost the sheet-configured amount
  v_cost := CASE WHEN coalesce(v_row.name_change_count,0) = 0 THEN 0 ELSE coalesce(p_cost, 100) END;

  IF NOT v_changed THEN
    RETURN v_row;
  END IF;

  IF v_cost > 0 AND coalesce(v_row.gold,0) < v_cost THEN
    RAISE EXCEPTION 'Not enough Gold. % Gold required.', v_cost;
  END IF;

  UPDATE public.player_stats
     SET gold = gold - v_cost,
         player_name = v_clean,
         phone = coalesce(p_phone,''),
         default_address = coalesce(p_address,''),
         name_change_count = coalesce(name_change_count,0) + 1,
         updated_at = now()
   WHERE player_key = p_player_key
  RETURNING * INTO v_row;

  IF p_member_id IS NOT NULL THEN
    UPDATE public.members SET player_name = v_clean, updated_at = now()
      WHERE id = p_member_id;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.edit_player_profile_paid(text, text, text, text, uuid, int) TO anon, authenticated, service_role;
