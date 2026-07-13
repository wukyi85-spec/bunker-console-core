
-- =========================================================
-- 1. MEMBERS: drop public read; login_member RPC handles it
-- =========================================================
DROP POLICY IF EXISTS "members public read" ON public.members;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.members FROM anon, authenticated;

-- =========================================================
-- 2. ORDERS: drop open policies, revoke anon/auth, expose via RPC
-- =========================================================
DROP POLICY IF EXISTS "orders open insert" ON public.orders;
DROP POLICY IF EXISTS "orders open read"   ON public.orders;
DROP POLICY IF EXISTS "orders open update" ON public.orders;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_player_orders(p_player_key text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE player_key = p_player_key ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.create_player_order(payload jsonb)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row public.orders;
BEGIN
  INSERT INTO public.orders (
    mission_number, player_key, member_id, pass_id, player_name, character_id,
    items, order_items, customer_name, phone, address, notes, payment_method,
    total_grams, product_total, total_price, grand_total, status, xp_earned, gold_earned
  )
  VALUES (
    payload->>'mission_number',
    payload->>'player_key',
    NULLIF(payload->>'member_id','')::uuid,
    payload->>'pass_id',
    payload->>'player_name',
    payload->>'character_id',
    COALESCE(payload->'items','[]'::jsonb),
    COALESCE(payload->'order_items','[]'::jsonb),
    payload->>'customer_name',
    payload->>'phone',
    payload->>'address',
    payload->>'notes',
    payload->>'payment_method',
    COALESCE((payload->>'total_grams')::numeric,0),
    COALESCE((payload->>'product_total')::numeric,0),
    NULLIF(payload->>'total_price','')::numeric,
    COALESCE((payload->>'grand_total')::numeric,0),
    COALESCE(payload->>'status','waiting_payment'),
    COALESCE((payload->>'xp_earned')::int,0),
    COALESCE((payload->>'gold_earned')::int,0)
  )
  RETURNING * INTO new_row;
  RETURN new_row;
END;
$$;

-- =========================================================
-- 3. PLAYER_STATS: drop open policies, expose via RPC
-- =========================================================
DROP POLICY IF EXISTS "stats open insert" ON public.player_stats;
DROP POLICY IF EXISTS "stats open read"   ON public.player_stats;
DROP POLICY IF EXISTS "stats open update" ON public.player_stats;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.player_stats FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_player_stats(p_player_key text)
RETURNS public.player_stats
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.player_stats WHERE player_key = p_player_key LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.upsert_player_stats(payload jsonb)
RETURNS public.player_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.player_stats;
BEGIN
  INSERT INTO public.player_stats (
    player_key, player_name, character_id, xp, gold, level, activity,
    current_rank, total_purchase, total_weight
  ) VALUES (
    payload->>'player_key',
    payload->>'player_name',
    payload->>'character_id',
    COALESCE((payload->>'xp')::int,0),
    COALESCE((payload->>'gold')::int,0),
    COALESCE((payload->>'level')::int,1),
    COALESCE((payload->>'activity')::int,50),
    COALESCE(payload->>'current_rank','ROOKIE'),
    COALESCE((payload->>'total_purchase')::numeric,0),
    COALESCE((payload->>'total_weight')::numeric,0)
  )
  ON CONFLICT (player_key) DO UPDATE SET
    player_name    = EXCLUDED.player_name,
    character_id   = EXCLUDED.character_id,
    xp             = EXCLUDED.xp,
    gold           = EXCLUDED.gold,
    level          = EXCLUDED.level,
    activity       = EXCLUDED.activity,
    current_rank   = EXCLUDED.current_rank,
    total_purchase = EXCLUDED.total_purchase,
    total_weight   = EXCLUDED.total_weight,
    updated_at     = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_player_activity(p_player_key text, p_activity int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.player_stats SET activity = p_activity, updated_at = now() WHERE player_key = p_player_key;
$$;

CREATE OR REPLACE FUNCTION public.add_player_stats_rewards(p_player_key text, p_xp int, p_gold int, p_level int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.player_stats
     SET xp = xp + p_xp, gold = gold + p_gold, level = p_level, updated_at = now()
   WHERE player_key = p_player_key;
$$;

-- =========================================================
-- 4. PLAYER_MISSIONS: drop open policies, expose via RPC
-- =========================================================
DROP POLICY IF EXISTS "pm insert" ON public.player_missions;
DROP POLICY IF EXISTS "pm read"   ON public.player_missions;
DROP POLICY IF EXISTS "pm update" ON public.player_missions;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.player_missions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_player_missions(p_player_key text)
RETURNS SETOF public.player_missions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.player_missions WHERE player_key = p_player_key;
$$;

CREATE OR REPLACE FUNCTION public.upsert_player_mission(
  p_player_key text, p_mission_id text, p_progress numeric, p_completed_at timestamptz
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.player_missions (player_key, mission_id, progress, completed_at)
  VALUES (p_player_key, p_mission_id, p_progress, p_completed_at)
  ON CONFLICT (player_key, mission_id) DO UPDATE
    SET progress = EXCLUDED.progress,
        completed_at = EXCLUDED.completed_at,
        updated_at = now();
$$;

-- =========================================================
-- 5. PLAYER_REWARDS: drop open policies, expose via RPC
-- =========================================================
DROP POLICY IF EXISTS "pr insert" ON public.player_rewards;
DROP POLICY IF EXISTS "pr read"   ON public.player_rewards;
DROP POLICY IF EXISTS "pr update" ON public.player_rewards;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.player_rewards FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_player_rewards(p_player_key text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.earned_at DESC), '[]'::jsonb)
  FROM (
    SELECT pr.id, pr.reward_id, pr.earned_at, pr.claimed_at, pr.source,
           to_jsonb(r) AS reward
    FROM public.player_rewards pr
    LEFT JOIN public.rewards r ON r.id = pr.reward_id
    WHERE pr.player_key = p_player_key
  ) x;
$$;

CREATE OR REPLACE FUNCTION public.insert_player_reward(p_player_key text, p_reward_id text, p_source text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.player_rewards (player_key, reward_id, source) VALUES (p_player_key, p_reward_id, p_source);
$$;

CREATE OR REPLACE FUNCTION public.claim_player_reward(p_id uuid, p_player_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.player_rewards SET claimed_at = now() WHERE id = p_id AND player_key = p_player_key;
$$;

-- Grant execute on all new RPCs to anon/authenticated
GRANT EXECUTE ON FUNCTION public.list_player_orders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_player_order(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_player_stats(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_player_activity(text,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_player_stats_rewards(text,int,int,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_player_missions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_player_mission(text,text,numeric,timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_player_rewards(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_player_reward(text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_player_reward(uuid,text) TO anon, authenticated;

-- Ensure needed unique constraints for upserts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_stats_player_key_key') THEN
    BEGIN
      ALTER TABLE public.player_stats ADD CONSTRAINT player_stats_player_key_key UNIQUE (player_key);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN NULL;
    END;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_missions_pk_mission') THEN
    BEGIN
      ALTER TABLE public.player_missions ADD CONSTRAINT player_missions_pk_mission UNIQUE (player_key, mission_id);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN NULL;
    END;
  END IF;
END $$;
