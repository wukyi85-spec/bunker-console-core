
-- 1. Add columns to members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'Rookie',
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS stars integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_purchase numeric NOT NULL DEFAULT 0;

ALTER TABLE public.members ALTER COLUMN player_name DROP NOT NULL;

-- 2. Seed admin account (idempotent)
INSERT INTO public.members (pass_id, password, player_name, character_id, role, status, rank)
VALUES ('ADMINBLACK21', '09777508034', NULL, NULL, 'admin', 'active', 'BLACK')
ON CONFLICT (pass_id) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'admin',
  status = 'active';

-- 3. Update login_member to return role and status
DROP FUNCTION IF EXISTS public.login_member(text, text);
CREATE OR REPLACE FUNCTION public.login_member(p_pass_id text, p_password text)
RETURNS TABLE(member_id uuid, pass_id text, player_name text, character_id text, role text, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id, m.pass_id, m.player_name, m.character_id, m.role, m.status
  FROM public.members m
  WHERE m.pass_id = p_pass_id
    AND m.password = p_password
    AND m.status = 'active'
  LIMIT 1;
$$;

-- 4. Internal admin verifier
CREATE OR REPLACE FUNCTION public._verify_admin(p_pass_id text, p_password text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE pass_id = p_pass_id
      AND password = p_password
      AND role = 'admin'
      AND status = 'active'
  );
$$;

-- 5. Admin list members
CREATE OR REPLACE FUNCTION public.admin_list_members(p_admin_pass_id text, p_admin_password text)
RETURNS SETOF public.members
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.members ORDER BY created_at DESC;
END;
$$;

-- 6. Admin create member
CREATE OR REPLACE FUNCTION public.admin_create_member(
  p_admin_pass_id text,
  p_admin_password text,
  p_pass_id text,
  p_password text,
  p_rank text,
  p_status text
) RETURNS public.members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_row public.members;
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_pass_id IS NULL OR length(trim(p_pass_id)) = 0 THEN
    RAISE EXCEPTION 'Pass ID is required';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  IF EXISTS (SELECT 1 FROM public.members WHERE pass_id = p_pass_id) THEN
    RAISE EXCEPTION 'Pass ID already exists';
  END IF;

  INSERT INTO public.members (
    pass_id, password, player_name, character_id,
    role, status, rank, xp, gold, activity, stars, total_purchase
  ) VALUES (
    p_pass_id, p_password, NULL, NULL,
    'member', COALESCE(p_status, 'active'), COALESCE(p_rank, 'Rookie'),
    0, 0, 30, 1, 0
  ) RETURNING * INTO new_row;
  RETURN new_row;
END;
$$;

-- 7. Admin update member
CREATE OR REPLACE FUNCTION public.admin_update_member(
  p_admin_pass_id text,
  p_admin_password text,
  p_member_id uuid,
  p_updates jsonb
) RETURNS public.members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_row public.members;
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
  RETURN updated_row;
END;
$$;
