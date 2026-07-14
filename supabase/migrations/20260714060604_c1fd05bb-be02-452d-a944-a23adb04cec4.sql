
-- 1. Voucher percent column
ALTER TABLE public.player_vouchers
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 10;

-- 2. Order type + voucher audit columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'supply',
  ADD COLUMN IF NOT EXISTS voucher_percent numeric,
  ADD COLUMN IF NOT EXISTS voucher_max_discount numeric;

-- 3. Redemption RPC: physical no longer inserts player_rewards (loadout is client-side);
--    voucher stores discount_percent instead of a fixed discount_amount.
CREATE OR REPLACE FUNCTION public.redeem_shop_reward(
  p_player_key text,
  p_reward_id text,
  p_reward_name text,
  p_gold_cost integer,
  p_type text,
  p_discount_amount numeric,   -- kept for signature compat; ignored for voucher %
  p_expire_days integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_stats public.player_stats;
  v_code text;
  v_voucher public.player_vouchers;
  v_percent numeric := 10;
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

  UPDATE public.player_stats
     SET gold = gold - p_gold_cost, updated_at = now()
   WHERE player_key = p_player_key;

  IF lower(coalesce(p_type,'physical')) = 'voucher' THEN
    v_code := 'BB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    INSERT INTO public.player_vouchers (
      player_key, reward_id, reward_name, code, discount_amount, discount_percent, gold_cost, expires_at
    ) VALUES (
      p_player_key, p_reward_id, p_reward_name, v_code,
      NULL,               -- discount is dynamic; computed at checkout
      v_percent,          -- 10% default
      p_gold_cost,
      CASE WHEN coalesce(p_expire_days,0) > 0
           THEN now() + make_interval(days => p_expire_days)
           ELSE NULL END
    ) RETURNING * INTO v_voucher;

    INSERT INTO public.player_notifications (player_key, type, title, message)
    VALUES (p_player_key, 'REWARD', 'VOUCHER UNLOCKED',
            p_reward_name || ' — code ' || v_code || ' (' || v_percent::text || '% OFF)');

    RETURN jsonb_build_object('kind','voucher','voucher', to_jsonb(v_voucher));
  ELSE
    -- Physical: gold charged; item goes to client-side reward loadout.
    -- Do NOT insert player_rewards here; that record is created when the
    -- reward order is marked delivered (or never — the order row is the receipt).
    INSERT INTO public.player_notifications (player_key, type, title, message)
    VALUES (p_player_key, 'REWARD', 'REWARD REDEEMED',
            p_reward_name || ' added to your Reward Loadout.');

    RETURN jsonb_build_object(
      'kind','physical',
      'reward', jsonb_build_object(
        'reward_id', p_reward_id,
        'reward_name', p_reward_name,
        'gold_cost', p_gold_cost
      )
    );
  END IF;
END;
$function$;

-- 4. Order creation RPC: accept order_type + mark voucher USED on submit
CREATE OR REPLACE FUNCTION public.create_player_order(payload jsonb)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_row public.orders;
  v_voucher_code text := NULLIF(btrim(coalesce(payload->>'voucher_code','')),'');
BEGIN
  INSERT INTO public.orders (
    mission_number, player_key, member_id, pass_id, player_name, character_id,
    items, order_items, customer_name, phone, address, notes, payment_method,
    total_grams, product_total, total_price, grand_total, status,
    xp_earned, gold_earned, payment_reference, voucher_code, voucher_discount,
    order_type, voucher_percent, voucher_max_discount
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
    COALESCE((payload->>'gold_earned')::int,0),
    NULLIF(btrim(coalesce(payload->>'payment_reference','')),''),
    v_voucher_code,
    COALESCE((payload->>'voucher_discount')::numeric,0),
    COALESCE(NULLIF(btrim(coalesce(payload->>'order_type','')),''),'supply'),
    NULLIF(payload->>'voucher_percent','')::numeric,
    NULLIF(payload->>'voucher_max_discount','')::numeric
  )
  RETURNING * INTO new_row;

  -- Mark voucher USED (one-time use) immediately on order submission
  IF v_voucher_code IS NOT NULL THEN
    UPDATE public.player_vouchers
       SET redeemed_at = now()
     WHERE player_key = new_row.player_key
       AND upper(code) = upper(v_voucher_code)
       AND redeemed_at IS NULL;
  END IF;

  RETURN new_row;
END;
$function$;

-- 5. Delivery RPC: skip missions for voucher orders; grant nothing for reward orders
CREATE OR REPLACE FUNCTION public.admin_mark_order_delivered(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_row public.orders;
  v_xp int;
  v_gold int;
  v_mission RECORD;
  v_current_progress numeric;
  v_new_progress numeric;
  v_is_reward boolean;
  v_has_voucher boolean;
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_row FROM public.orders WHERE id = p_order_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_row.tracking_url IS NULL OR length(btrim(v_row.tracking_url)) = 0 THEN
    RAISE EXCEPTION 'Add a tracking link before marking as delivered';
  END IF;
  IF lower(v_row.status) = 'cancelled' THEN
    RAISE EXCEPTION 'Order was cancelled';
  END IF;

  UPDATE public.orders
     SET status = 'completed',
         completed_at = COALESCE(completed_at, now()),
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_row;

  v_is_reward := lower(coalesce(v_row.order_type,'supply')) = 'reward';
  v_has_voucher := v_row.voucher_code IS NOT NULL AND length(btrim(v_row.voucher_code)) > 0;

  IF v_row.rewards_awarded_at IS NULL AND NOT v_is_reward THEN
    -- Reward orders: no XP, no Gold, no missions, no purchase totals.
    v_xp := floor(coalesce(v_row.grand_total, v_row.product_total, 0) / 10)::int;
    v_gold := floor(coalesce(v_row.grand_total, v_row.product_total, 0) / 20)::int;

    UPDATE public.orders
       SET rewards_awarded_at = now(),
           xp_earned = v_xp,
           gold_earned = v_gold
     WHERE id = p_order_id
    RETURNING * INTO v_row;

    UPDATE public.player_stats
       SET xp = xp + v_xp,
           gold = gold + v_gold,
           level = GREATEST(1, ((xp + v_xp) / 100) + 1),
           total_purchase = COALESCE(total_purchase,0) + COALESCE(v_row.product_total,0),
           total_weight = COALESCE(total_weight,0) + COALESCE(v_row.total_grams,0),
           updated_at = now()
     WHERE player_key = v_row.player_key;

    -- Voucher-carrying orders: skip mission progression entirely
    IF NOT v_has_voucher THEN
      FOR v_mission IN
        SELECT m.id, m.metric, m.target_value, m.xp_reward, m.gold_reward, m.reward_id
        FROM public.missions m
        WHERE m.active = true
      LOOP
        SELECT COALESCE(pm.progress, 0) INTO v_current_progress
          FROM public.player_missions pm
          WHERE pm.player_key = v_row.player_key AND pm.mission_id = v_mission.id;
        IF EXISTS (
          SELECT 1 FROM public.player_missions pm
          WHERE pm.player_key = v_row.player_key AND pm.mission_id = v_mission.id
            AND pm.completed_at IS NOT NULL
        ) THEN
          CONTINUE;
        END IF;

        v_new_progress := CASE
          WHEN v_mission.metric = 'weight' THEN GREATEST(COALESCE(v_current_progress,0), COALESCE(v_row.total_grams,0))
          WHEN v_mission.metric = 'spend'  THEN COALESCE(v_current_progress,0) + COALESCE(v_row.product_total,0)
          WHEN v_mission.metric = 'order'  THEN COALESCE(v_current_progress,0) + 1
          ELSE COALESCE(v_current_progress,0)
        END;

        INSERT INTO public.player_missions (player_key, mission_id, progress, completed_at)
        VALUES (
          v_row.player_key, v_mission.id,
          LEAST(v_new_progress, v_mission.target_value),
          CASE WHEN v_new_progress >= v_mission.target_value THEN now() ELSE NULL END
        )
        ON CONFLICT (player_key, mission_id) DO UPDATE
          SET progress = LEAST(v_new_progress, v_mission.target_value),
              completed_at = CASE WHEN v_new_progress >= v_mission.target_value AND public.player_missions.completed_at IS NULL THEN now() ELSE public.player_missions.completed_at END,
              updated_at = now();

        IF v_new_progress >= v_mission.target_value AND v_current_progress < v_mission.target_value THEN
          UPDATE public.player_stats
            SET xp = xp + v_mission.xp_reward,
                gold = gold + v_mission.gold_reward,
                updated_at = now()
            WHERE player_key = v_row.player_key;

          IF v_mission.reward_id IS NOT NULL THEN
            INSERT INTO public.player_rewards (player_key, reward_id, source)
            VALUES (v_row.player_key, v_mission.reward_id, v_mission.id);
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSIF v_row.rewards_awarded_at IS NULL AND v_is_reward THEN
    -- Mark awarded so we don't retry
    UPDATE public.orders
       SET rewards_awarded_at = now(),
           xp_earned = 0,
           gold_earned = 0
     WHERE id = p_order_id
    RETURNING * INTO v_row;
  END IF;

  INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
  VALUES (
    v_row.player_key,
    'ORDER_COMPLETED',
    'ORDER COMPLETED',
    'Mission ' || v_row.mission_number || ' has been delivered.',
    v_row.mission_number
  );

  RETURN v_row;
END;
$function$;
