
-- Login: normalize both sides, return status regardless of active so app can handle "suspended".
CREATE OR REPLACE FUNCTION public.login_member(p_pass_id text, p_password text)
RETURNS TABLE(member_id uuid, pass_id text, player_name text, character_id text, role text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.pass_id, m.player_name, m.character_id, m.role, m.status
  FROM public.members m
  WHERE upper(btrim(m.pass_id)) = upper(btrim(p_pass_id))
    AND btrim(m.password) = btrim(p_password)
  LIMIT 1;
$$;

-- Admin create: trim + uppercase pass_id, trim password, enforce uniqueness case-insensitively.
CREATE OR REPLACE FUNCTION public.admin_create_member(
  p_admin_pass_id text, p_admin_password text,
  p_pass_id text, p_password text, p_rank text, p_status text
) RETURNS public.members
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_row public.members;
  v_pass_id text := upper(btrim(coalesce(p_pass_id,'')));
  v_password text := btrim(coalesce(p_password,''));
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF length(v_pass_id) = 0 THEN
    RAISE EXCEPTION 'Pass ID is required';
  END IF;
  IF length(v_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  IF EXISTS (SELECT 1 FROM public.members WHERE upper(btrim(pass_id)) = v_pass_id) THEN
    RAISE EXCEPTION 'Pass ID already exists';
  END IF;

  INSERT INTO public.members (
    pass_id, password, player_name, character_id,
    role, status, rank, xp, gold, activity, stars, total_purchase
  ) VALUES (
    v_pass_id, v_password, NULL, NULL,
    'member', COALESCE(NULLIF(btrim(p_status),''),'active'),
    COALESCE(NULLIF(btrim(p_rank),''),'Rookie'),
    0, 0, 30, 1, 0
  ) RETURNING * INTO new_row;
  RETURN new_row;
END;
$$;
