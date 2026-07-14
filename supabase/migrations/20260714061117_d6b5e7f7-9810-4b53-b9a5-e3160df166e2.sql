
-- Columns for the new order flow
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'supply',
  ADD COLUMN IF NOT EXISTS voucher_percent numeric,
  ADD COLUMN IF NOT EXISTS voucher_max_discount numeric;

ALTER TABLE public.player_vouchers
  ADD COLUMN IF NOT EXISTS discount_percent numeric;

-- Redeem: physical rewards no longer create player_rewards rows (client-side loadout)
CREATE OR REPLACE FUNCTION public.redeem_shop_reward(
  p_player_key text, p_reward_id text, p_reward_name text, p_gold_cost integer,
  p_type text, p_discount_amount numeric, p_expire_days integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_stats public.player_stats;
  v_code text;
  v_voucher public.player_vouchers;
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
      player_key, reward_id, reward_name, code,
      discount_amount, discount_percent, gold_cost, expires_at
    ) VALUES (
      p_player_key, p_reward_id, p_reward_name, v_code,
      NULL, 10, p_gold_cost,
      CASE WHEN coalesce(p_expire_days,0) > 0
           THEN now() + make_interval(days => p_expire_days)
           ELSE NULL END
    ) RETURNING * INTO v_voucher;

    INSERT INTO public.player_notifications (player_key, type, title, message)
    VALUES (p_player_key, 'REWARD', 'VOUCHER UNLOCKED',
            p_reward_name || ' — 10% off code ' || v_code);

    RETURN jsonb_build_object('kind','voucher','voucher', to_jsonb(v_voucher));
  ELSE
    -- Physical reward: just charge gold; the client-side Reward Loadout carries it.
    INSERT INTO public.player_notifications (player_key, type, title, message)
    VALUES (p_player_key, 'REWARD', 'REWARD ADDED', p_reward_name || ' added to Reward Loadout.');

    RETURN jsonb_build_object('kind','physical');
  END IF;
END;
$function$;

-- create_player_order: accept order_type + mark voucher used at submit
CREATE OR REPLACE FUNCTION public.create_player_order(payload jsonb)
RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

  IF v_voucher_code IS NOT NULL THEN
    UPDATE public.player_vouchers
       SET redeemed_at = now()
     WHERE code = v_voucher_code AND player_key = new_row.player_key AND redeemed_at IS NULL;
  END IF;

  RETURN new_row;
END;
$function$;

-- Mark delivered: reward => no XP/Gold/missions. voucher => XP/Gold, no missions. supply => normal.
CREATE OR REPLACE FUNCTION public.admin_mark_order_delivered(
  p_admin_pass_id text, p_admin_password text, p_order_id uuid
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_row public.orders;
  v_xp int;
  v_gold int;
  v_mission RECORD;
  v_current_progress numeric;
  v_new_progress numeric;
  v_type text;
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

  v_type := lower(coalesce(v_row.order_type,'supply'));

  IF v_row.rewards_awarded_at IS NULL THEN
    IF v_type = 'reward' THEN
      v_xp := 0; v_gold := 0;
    ELSE
      v_xp := floor(coalesce(v_row.grand_total, v_row.product_total, 0) / 10)::int;
      v_gold := floor(coalesce(v_row.grand_total, v_row.product_total, 0) / 20)::int;
    END IF;

    UPDATE public.orders
       SET rewards_awarded_at = now(), xp_earned = v_xp, gold_earned = v_gold
     WHERE id = p_order_id
    RETURNING * INTO v_row;

    IF v_xp > 0 OR v_gold > 0 THEN
      UPDATE public.player_stats
         SET xp = xp + v_xp,
             gold = gold + v_gold,
             level = GREATEST(1, ((xp + v_xp) / 100) + 1),
             total_purchase = COALESCE(total_purchase,0) + COALESCE(v_row.product_total,0),
             total_weight = COALESCE(total_weight,0) + COALESCE(v_row.total_grams,0),
             updated_at = now()
       WHERE player_key = v_row.player_key;
    END IF;

    -- Mission progress: SUPPLY orders only
    IF v_type = 'supply' THEN
      FOR v_mission IN
        SELECT m.id, m.metric, m.target_value, m.xp_reward, m.gold_reward, m.reward_id
        FROM public.missions m WHERE m.active = true
      LOOP
        SELECT COALESCE(pm.progress,0) INTO v_current_progress
          FROM public.player_missions pm
          WHERE pm.player_key = v_row.player_key AND pm.mission_id = v_mission.id;
        IF EXISTS (
          SELECT 1 FROM public.player_missions pm
          WHERE pm.player_key = v_row.player_key AND pm.mission_id = v_mission.id
            AND pm.completed_at IS NOT NULL
        ) THEN CONTINUE; END IF;

        v_new_progress := CASE
          WHEN v_mission.metric = 'weight' THEN GREATEST(COALESCE(v_current_progress,0), COALESCE(v_row.total_grams,0))
          WHEN v_mission.metric = 'spend'  THEN COALESCE(v_current_progress,0) + COALESCE(v_row.product_total,0)
          WHEN v_mission.metric = 'order'  THEN COALESCE(v_current_progress,0) + 1
          ELSE COALESCE(v_current_progress,0)
        END;

        INSERT INTO public.player_missions (player_key, mission_id, progress, completed_at)
        VALUES (v_row.player_key, v_mission.id,
                LEAST(v_new_progress, v_mission.target_value),
                CASE WHEN v_new_progress >= v_mission.target_value THEN now() ELSE NULL END)
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
  END IF;

  INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
  VALUES (v_row.player_key,'ORDER_COMPLETED','ORDER COMPLETED',
          'Mission ' || v_row.mission_number || ' has been delivered.', v_row.mission_number);

  RETURN v_row;
END;
$function$;
