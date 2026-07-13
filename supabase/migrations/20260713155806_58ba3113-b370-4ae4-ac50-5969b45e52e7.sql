
-- Player profile info + Member Since + Order tracking/delivery fee + admin delete/tracking RPCs

ALTER TABLE public.player_stats
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS default_address text,
  ADD COLUMN IF NOT EXISTS member_since timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;

-- Update profile info (name/phone/address). Free.
CREATE OR REPLACE FUNCTION public.update_player_profile_info(
  p_player_key text,
  p_full_name text,
  p_phone text,
  p_default_address text
) RETURNS player_stats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.player_stats;
BEGIN
  UPDATE public.player_stats
    SET full_name = NULLIF(btrim(coalesce(p_full_name,'')),''),
        phone = NULLIF(btrim(coalesce(p_phone,'')),''),
        default_address = NULLIF(btrim(coalesce(p_default_address,'')),''),
        updated_at = now()
    WHERE player_key = p_player_key
    RETURNING * INTO r;
  IF r.player_key IS NULL THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;
  RETURN r;
END;
$$;

-- Change player name (costs 100 gold). Validates & deducts.
CREATE OR REPLACE FUNCTION public.change_player_name(
  p_player_key text,
  p_new_name text,
  p_member_id uuid
) RETURNS player_stats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.player_stats;
  v_new text := upper(btrim(coalesce(p_new_name,'')));
BEGIN
  IF length(v_new) < 3 OR length(v_new) > 16 THEN
    RAISE EXCEPTION 'Player name must be 3-16 characters';
  END IF;
  IF v_new !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Letters and numbers only';
  END IF;

  SELECT * INTO r FROM public.player_stats WHERE player_key = p_player_key;
  IF r.player_key IS NULL THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;
  IF r.gold < 100 THEN
    RAISE EXCEPTION 'Not enough Gold. 100 Gold required.';
  END IF;

  UPDATE public.player_stats
    SET gold = gold - 100,
        player_name = v_new,
        updated_at = now()
    WHERE player_key = p_player_key
    RETURNING * INTO r;

  IF p_member_id IS NOT NULL THEN
    UPDATE public.members SET player_name = v_new, updated_at = now() WHERE id = p_member_id;
  END IF;
  RETURN r;
END;
$$;

-- Admin: set tracking URL on an order + notify player
CREATE OR REPLACE FUNCTION public.admin_set_order_tracking(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid,
  p_url text
) RETURNS orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.orders;
  v_url text := NULLIF(btrim(coalesce(p_url,'')),'');
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.orders
     SET tracking_url = v_url, updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_url IS NOT NULL THEN
    INSERT INTO public.player_notifications (player_key, type, title, message, order_id)
    VALUES (
      v_row.player_key,
      'ORDER',
      'TRACKING AVAILABLE',
      'Mission ' || v_row.mission_number || ' tracking link is now available.',
      v_row.mission_number
    );
  END IF;
  RETURN v_row;
END;
$$;

-- Admin: hard-delete an order (test order cleanup)
CREATE OR REPLACE FUNCTION public.admin_delete_order(
  p_admin_pass_id text,
  p_admin_password text,
  p_order_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM public.orders WHERE id = p_order_id;
  RETURN p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_player_profile_info(text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_player_name(text,text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_order_tracking(text,text,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(text,text,uuid) TO anon, authenticated;
