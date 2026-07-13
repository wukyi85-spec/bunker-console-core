
ALTER TABLE public.player_stats
  ADD COLUMN IF NOT EXISTS name_change_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.change_player_name(
  p_player_key text,
  p_new_name text,
  p_member_id uuid
)
RETURNS public.player_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_row public.player_stats;
  v_clean text := upper(regexp_replace(coalesce(p_new_name,''), '[^A-Za-z0-9]', '', 'g'));
  v_cost int;
BEGIN
  IF length(v_clean) < 3 OR length(v_clean) > 16 THEN
    RAISE EXCEPTION 'Player name must be 3-16 letters or numbers';
  END IF;

  SELECT * INTO v_row FROM public.player_stats WHERE player_key = p_player_key;
  IF v_row.player_key IS NULL THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;

  v_cost := CASE WHEN coalesce(v_row.name_change_count,0) = 0 THEN 0 ELSE 100 END;

  IF v_cost > 0 AND coalesce(v_row.gold,0) < v_cost THEN
    RAISE EXCEPTION 'Not enough Gold. 100 Gold required.';
  END IF;

  UPDATE public.player_stats
     SET gold = gold - v_cost,
         player_name = v_clean,
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
$function$;
