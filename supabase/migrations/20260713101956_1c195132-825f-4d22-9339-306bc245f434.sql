
-- Rebuild login_member to include rank/xp/gold/activity/stars and enforce active status,
-- while keeping normalization (upper+trim on pass_id, trim on password).
DROP FUNCTION IF EXISTS public.login_member(text, text);

CREATE OR REPLACE FUNCTION public.login_member(p_pass_id text, p_password text)
RETURNS TABLE(
  member_id uuid,
  pass_id text,
  player_name text,
  character_id text,
  role text,
  status text,
  rank text,
  xp integer,
  gold integer,
  activity integer,
  stars integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id, m.pass_id, m.player_name, m.character_id, m.role, m.status,
         m.rank, m.xp, m.gold, m.activity, m.stars
  FROM public.members m
  WHERE upper(btrim(m.pass_id)) = upper(btrim(p_pass_id))
    AND btrim(m.password) = btrim(p_password)
    AND m.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.login_member(text, text) TO anon, authenticated;
