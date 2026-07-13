
-- Orders: audit columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by text;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.player_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_key text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  order_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_notifications_player_key_idx
  ON public.player_notifications (player_key, created_at DESC);

GRANT ALL ON public.player_notifications TO service_role;
ALTER TABLE public.player_notifications ENABLE ROW LEVEL SECURITY;
-- No public policies: all access is via SECURITY DEFINER RPCs below.

-- Admin: list orders
CREATE OR REPLACE FUNCTION public.admin_list_orders(
  p_admin_pass_id text,
  p_admin_password text
)
RETURNS SETOF public.orders
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.orders ORDER BY created_at DESC;
END;
$$;

-- Admin: confirm an order + create notification
CREATE OR REPLACE FUNCTION public.admin_confirm_order(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.orders;
  v_admin_pass text := upper(btrim(coalesce(p_admin_pass_id,'')));
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.orders
     SET status = 'confirmed',
         confirmed_at = now(),
         confirmed_by = v_admin_pass,
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
  VALUES (
    v_row.player_key,
    'ORDER',
    'ORDER CONFIRMED',
    'Mission ' || v_row.mission_number || ' has been confirmed.',
    v_row.mission_number
  );

  RETURN v_row;
END;
$$;

-- Player: list notifications
CREATE OR REPLACE FUNCTION public.list_player_notifications(p_player_key text)
RETURNS SETOF public.player_notifications
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.player_notifications
  WHERE player_key = p_player_key
  ORDER BY created_at DESC
  LIMIT 50;
$$;

-- Player: mark notification read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid, p_player_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.player_notifications
     SET is_read = true
   WHERE id = p_id AND player_key = p_player_key;
$$;
