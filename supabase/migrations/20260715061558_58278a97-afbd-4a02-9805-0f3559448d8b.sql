
-- Force all client access through SECURITY DEFINER RPCs by revoking
-- direct table privileges from anon/authenticated. RPCs run as owner
-- and continue to work; RLS becomes irrelevant for direct reads
-- because the roles have no table privileges. We also add explicit
-- restrictive SELECT policies so the scanner sees a policy on file.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['members','orders','player_missions','player_notifications','player_rewards','player_stats'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop any prior deny policy we may have created, then recreate.
    EXECUTE format('DROP POLICY IF EXISTS "Deny direct client access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Deny direct client access" ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t
    );
  END LOOP;
END $$;
