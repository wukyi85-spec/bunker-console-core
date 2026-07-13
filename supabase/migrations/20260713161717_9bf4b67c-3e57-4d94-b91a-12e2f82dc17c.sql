
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rewards_awarded_at timestamptz;

-- When a tracking link is saved, automatically move the order into
-- out_for_delivery (unless it is already completed or cancelled).
CREATE OR REPLACE FUNCTION public.admin_set_order_tracking(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid,
  p_url text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_row public.orders;
  v_url text := NULLIF(btrim(coalesce(p_url,'')), '');
  v_current text;
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT status INTO v_current FROM public.orders WHERE id = p_order_id;
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.orders
     SET tracking_url = v_url,
         status = CASE
                    WHEN v_url IS NOT NULL AND lower(v_current) NOT IN ('completed','cancelled')
                      THEN 'out_for_delivery'
                    ELSE status
                  END,
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_row;

  IF v_url IS NOT NULL THEN
    INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
    VALUES (
      v_row.player_key,
      'ORDER_TRACKING',
      'OUT FOR DELIVERY',
      'Mission ' || v_row.mission_number || ' is out for delivery.',
      v_row.mission_number
    );
  END IF;

  RETURN v_row;
END;
$function$;

-- Mark as delivered: complete the order and award XP/Gold once.
CREATE OR REPLACE FUNCTION public.admin_mark_order_delivered(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_row public.orders;
  v_xp int;
  v_gold int;
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

  -- Award XP + Gold exactly once.
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
           updated_at = now()
     WHERE player_key = v_row.player_key;
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
