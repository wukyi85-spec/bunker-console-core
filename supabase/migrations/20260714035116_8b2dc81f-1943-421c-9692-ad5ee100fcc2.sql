
-- Vouchers earned by players from redeeming voucher-type rewards.
CREATE TABLE IF NOT EXISTS public.player_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_key text NOT NULL,
  reward_id text NOT NULL,
  reward_name text NOT NULL,
  code text NOT NULL UNIQUE,
  discount_amount numeric,
  gold_cost integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_vouchers TO authenticated;
GRANT ALL ON public.player_vouchers TO service_role;

ALTER TABLE public.player_vouchers ENABLE ROW LEVEL SECURITY;

-- No direct table access needed; RPC is SECURITY DEFINER.
CREATE POLICY "no direct access" ON public.player_vouchers FOR SELECT USING (false);

CREATE INDEX IF NOT EXISTS player_vouchers_player_key_idx ON public.player_vouchers (player_key, created_at DESC);

-- List vouchers for a player.
CREATE OR REPLACE FUNCTION public.list_player_vouchers(p_player_key text)
RETURNS SETOF public.player_vouchers
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.player_vouchers WHERE player_key = p_player_key ORDER BY created_at DESC;
$$;

-- Redeem a shop reward from the Rewards sheet.
-- p_type is either 'physical' or 'voucher'.
CREATE OR REPLACE FUNCTION public.redeem_shop_reward(
  p_player_key text,
  p_reward_id text,
  p_reward_name text,
  p_gold_cost integer,
  p_type text,
  p_discount_amount numeric,
  p_expire_days integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats public.player_stats;
  v_code text;
  v_voucher public.player_vouchers;
  v_reward_row public.player_rewards;
BEGIN
  IF p_gold_cost IS NULL OR p_gold_cost < 0 THEN
    RAISE EXCEPTION 'Invalid gold cost';
  END IF;

  SELECT * INTO v_stats FROM public.player_stats WHERE player_key = p_player_key;
  IF v_stats.player_key IS NULL THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;
  IF coalesce(v_stats.gold, 0) < p_gold_cost THEN
    RAISE EXCEPTION 'Not enough Gold';
  END IF;

  -- Charge gold.
  UPDATE public.player_stats
     SET gold = gold - p_gold_cost, updated_at = now()
   WHERE player_key = p_player_key;

  IF lower(coalesce(p_type,'physical')) = 'voucher' THEN
    v_code := 'BB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    INSERT INTO public.player_vouchers (
      player_key, reward_id, reward_name, code, discount_amount, gold_cost, expires_at
    ) VALUES (
      p_player_key, p_reward_id, p_reward_name, v_code,
      NULLIF(p_discount_amount, 0),
      p_gold_cost,
      CASE WHEN coalesce(p_expire_days,0) > 0
           THEN now() + make_interval(days => p_expire_days)
           ELSE NULL END
    ) RETURNING * INTO v_voucher;

    INSERT INTO public.player_notifications (player_key, type, title, message)
    VALUES (p_player_key, 'REWARD', 'VOUCHER UNLOCKED',
            p_reward_name || ' — code ' || v_code);

    RETURN jsonb_build_object('kind','voucher','voucher', to_jsonb(v_voucher));
  ELSE
    -- Physical reward: record in player_rewards. Use reward_id text as source tag.
    INSERT INTO public.player_rewards (player_key, reward_id, source)
    VALUES (p_player_key, p_reward_id, 'shop')
    RETURNING * INTO v_reward_row;

    INSERT INTO public.player_notifications (player_key, type, title, message)
    VALUES (p_player_key, 'REWARD', 'REWARD CLAIMED', p_reward_name || ' unlocked.');

    RETURN jsonb_build_object('kind','physical','reward', to_jsonb(v_reward_row));
  END IF;
END;
$$;
