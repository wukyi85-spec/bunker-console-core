
-- Add payment reference (last 5 digits) and voucher fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS voucher_code text,
  ADD COLUMN IF NOT EXISTS voucher_discount numeric DEFAULT 0;

-- Extend create_player_order to accept new fields
CREATE OR REPLACE FUNCTION public.create_player_order(payload jsonb)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_row public.orders;
BEGIN
  INSERT INTO public.orders (
    mission_number, player_key, member_id, pass_id, player_name, character_id,
    items, order_items, customer_name, phone, address, notes, payment_method,
    total_grams, product_total, total_price, grand_total, status,
    xp_earned, gold_earned, payment_reference, voucher_code, voucher_discount
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
    NULLIF(btrim(coalesce(payload->>'voucher_code','')),''),
    COALESCE((payload->>'voucher_discount')::numeric,0)
  )
  RETURNING * INTO new_row;
  RETURN new_row;
END;
$function$;

-- Extend delivered RPC to also advance mission progress based on this completed order.
-- weight-metric missions: use single-order grams (max, not cumulative)
-- spend-metric missions: cumulative (add order total)
-- order-metric missions: cumulative (add 1)
CREATE OR REPLACE FUNCTION public.admin_mark_order_delivered(p_admin_pass_id text, p_admin_password text, p_order_id uuid)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.orders;
  v_xp int;
  v_gold int;
  v_mission RECORD;
  v_current_progress numeric;
  v_new_progress numeric;
  v_stats public.player_stats;
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

  IF v_row.rewards_awarded_at IS NULL THEN
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

    -- Advance missions
    FOR v_mission IN
      SELECT m.id, m.metric, m.target_value, m.xp_reward, m.gold_reward, m.reward_id
      FROM public.missions m
      WHERE m.active = true
    LOOP
      SELECT COALESCE(pm.progress, 0) INTO v_current_progress
        FROM public.player_missions pm
        WHERE pm.player_key = v_row.player_key AND pm.mission_id = v_mission.id;
      -- Skip missions already completed
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

      -- Grant mission rewards on first completion
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
