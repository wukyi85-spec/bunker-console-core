
CREATE OR REPLACE FUNCTION public.admin_cancel_order(p_admin_pass_id text, p_admin_password text, p_order_id uuid, p_reason text)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.orders;
  v_admin_pass text := upper(btrim(coalesce(p_admin_pass_id,'')));
  v_reason text := btrim(coalesce(p_reason,''));
  v_refund int := 0;
  v_item jsonb;
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF length(v_reason) = 0 THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;

  UPDATE public.orders
     SET status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = v_admin_pass,
         cancellation_reason = v_reason,
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Reward orders: refund the exact Gold amount spent.
  IF lower(coalesce(v_row.order_type,'supply')) = 'reward' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_row.items,'[]'::jsonb))
    LOOP
      v_refund := v_refund + COALESCE((v_item->>'goldCost')::int,0)
                           * COALESCE((v_item->>'quantity')::int,1);
    END LOOP;

    IF v_refund > 0 THEN
      UPDATE public.player_stats
         SET gold = COALESCE(gold,0) + v_refund,
             updated_at = now()
       WHERE player_key = v_row.player_key;
    END IF;
  END IF;

  INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
  VALUES (
    v_row.player_key,
    'ORDER_CANCELLED',
    'ORDER CANCELLED',
    'Mission ' || v_row.mission_number || ' was cancelled. Reason: ' || v_reason ||
      CASE WHEN v_refund > 0 THEN ' — ' || v_refund || ' Gold refunded.' ELSE '' END,
    v_row.mission_number
  );

  RETURN v_row;
END;
$function$;
