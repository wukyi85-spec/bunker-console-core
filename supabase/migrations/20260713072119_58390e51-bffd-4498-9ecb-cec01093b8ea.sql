CREATE OR REPLACE FUNCTION public.login_member(p_pass_id text, p_password text)
RETURNS TABLE (
  member_id uuid,
  pass_id text,
  player_name text,
  character_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id AS member_id, m.pass_id, m.player_name, m.character_id
  FROM public.members m
  WHERE m.pass_id = p_pass_id
    AND m.password = p_password
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.login_member(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_member(text, text) TO anon, authenticated, service_role;