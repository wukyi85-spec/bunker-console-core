
CREATE OR REPLACE FUNCTION public.admin_delete_member(
  p_admin_pass_id text,
  p_admin_password text,
  p_member_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.members;
  v_admin_pass text := upper(btrim(coalesce(p_admin_pass_id,'')));
  v_remaining_admins int;
BEGIN
  IF NOT public._verify_admin(p_admin_pass_id, p_admin_password) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_target FROM public.members WHERE id = p_member_id;
  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF upper(btrim(v_target.pass_id)) = v_admin_pass THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  IF v_target.role = 'admin' THEN
    SELECT count(*) INTO v_remaining_admins
      FROM public.members
      WHERE role = 'admin' AND status = 'active' AND id <> p_member_id;
    IF v_remaining_admins < 1 THEN
      RAISE EXCEPTION 'Cannot delete the last remaining admin';
    END IF;
  END IF;

  DELETE FROM public.members WHERE id = p_member_id;
  RETURN p_member_id;
END;
$$;
