
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE OR REPLACE FUNCTION public.admin_cancel_order(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid,
  p_reason text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.orders;
  v_admin_pass text := upper(btrim(coalesce(p_admin_pass_id,'')));
  v_reason text := btrim(coalesce(p_reason,''));
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

  INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
  VALUES (
    v_row.player_key,
    'ORDER_CANCELLED',
    'ORDER CANCELLED',
    'Mission ' || v_row.mission_number || ' was cancelled. Reason: ' || v_reason,
    v_row.mission_number
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cancel_order(text, text, uuid, text) TO anon, authenticated, service_role;
