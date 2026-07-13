
-- ==== player_stats: personal info ====
ALTER TABLE public.player_stats
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS default_address text,
  ADD COLUMN IF NOT EXISTS member_since timestamptz NOT NULL DEFAULT now();

-- ==== orders: tracking + delivery fee ====
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric;

-- ==== update_player_profile_info ====
CREATE OR REPLACE FUNCTION public.update_player_profile_info(
  p_player_key text,
  p_full_name text,
  p_phone text,
  p_default_address text
)
RETURNS public.player_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.player_stats;
BEGIN
  IF p_player_key IS NULL OR length(btrim(p_player_key)) = 0 THEN
    RAISE EXCEPTION 'Player key is required';
  END IF;

  -- Upsert (create the stats row if it does not exist yet).
  INSERT INTO public.player_stats (player_key, full_name, phone, default_address)
  VALUES (p_player_key, NULLIF(btrim(p_full_name),''), NULLIF(btrim(p_phone),''), NULLIF(btrim(p_default_address),''))
  ON CONFLICT (player_key) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        default_address = EXCLUDED.default_address,
        updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- ==== change_player_name (costs 100 Gold) ====
CREATE OR REPLACE FUNCTION public.change_player_name(
  p_player_key text,
  p_new_name text,
  p_member_id uuid
)
RETURNS public.player_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.player_stats;
  v_clean text := upper(regexp_replace(coalesce(p_new_name,''), '[^A-Za-z0-9]', '', 'g'));
BEGIN
  IF length(v_clean) < 3 OR length(v_clean) > 16 THEN
    RAISE EXCEPTION 'Player name must be 3-16 letters or numbers';
  END IF;

  SELECT * INTO v_row FROM public.player_stats WHERE player_key = p_player_key;
  IF v_row.player_key IS NULL THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;
  IF coalesce(v_row.gold,0) < 100 THEN
    RAISE EXCEPTION 'Not enough Gold. 100 Gold required.';
  END IF;

  UPDATE public.player_stats
     SET gold = gold - 100,
         player_name = v_clean,
         updated_at = now()
   WHERE player_key = p_player_key
  RETURNING * INTO v_row;

  IF p_member_id IS NOT NULL THEN
    UPDATE public.members SET player_name = v_clean, updated_at = now()
      WHERE id = p_member_id;
  END IF;

  RETURN v_row;
END;
$$;

-- ==== admin_set_order_tracking ====
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
AS $$
DECLARE
  v_row public.orders;
  v_url text := NULLIF(btrim(coalesce(p_url,'')), '');
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.orders
     SET tracking_url = v_url,
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Notify the member when a tracking link is added.
  IF v_url IS NOT NULL THEN
    INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
    VALUES (
      v_row.player_key,
      'ORDER_TRACKING',
      'TRACKING AVAILABLE',
      'Tracking link added for mission ' || v_row.mission_number || '.',
      v_row.mission_number
    );
  END IF;

  RETURN v_row;
END;
$$;

-- ==== admin_delete_order ====
CREATE OR REPLACE FUNCTION public.admin_delete_order(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  RETURN p_order_id;
END;
$$;
