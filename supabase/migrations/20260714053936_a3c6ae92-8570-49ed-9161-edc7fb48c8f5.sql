CREATE OR REPLACE FUNCTION public.complete_member_onboarding(
  p_pass_id text,
  p_player_name text,
  p_character_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pass_id text := upper(btrim(p_pass_id));
  v_name text := btrim(p_player_name);
  v_char text := btrim(p_character_id);
BEGIN
  IF v_pass_id IS NULL OR v_pass_id = '' THEN
    RAISE EXCEPTION 'pass_id required';
  END IF;
  IF v_name IS NULL OR v_name = '' OR v_char IS NULL OR v_char = '' THEN
    RAISE EXCEPTION 'player_name and character_id required';
  END IF;

  UPDATE public.members
    SET player_name = v_name,
        character_id = v_char,
        updated_at = now()
  WHERE upper(btrim(pass_id)) = v_pass_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'member not found';
  END IF;

  UPDATE public.player_stats
    SET player_name = v_name,
        character_id = v_char,
        updated_at = now()
  WHERE player_key = v_pass_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_member_onboarding(text, text, text) TO anon, authenticated, service_role;