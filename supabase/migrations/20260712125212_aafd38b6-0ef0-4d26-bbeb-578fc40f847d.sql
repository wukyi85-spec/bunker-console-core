
-- MEMBERS (login source)
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id text NOT NULL UNIQUE,
  password text NOT NULL,
  player_name text NOT NULL,
  character_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.members TO anon, authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members public read" ON public.members FOR SELECT USING (true);
CREATE TRIGGER trg_members_touch BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MISSIONS
CREATE TABLE public.missions (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  mission_type text NOT NULL DEFAULT 'weekly', -- weekly | special
  metric text NOT NULL, -- grams | thb | orders
  target_value numeric NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  gold_reward integer NOT NULL DEFAULT 0,
  reward_id text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.missions TO anon, authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions public read" ON public.missions FOR SELECT USING (true);

-- PLAYER MISSION PROGRESS
CREATE TABLE public.player_missions (
  player_key text NOT NULL,
  mission_id text NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  progress numeric NOT NULL DEFAULT 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_key, mission_id)
);
GRANT SELECT, INSERT, UPDATE ON public.player_missions TO anon, authenticated;
GRANT ALL ON public.player_missions TO service_role;
ALTER TABLE public.player_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm read" ON public.player_missions FOR SELECT USING (true);
CREATE POLICY "pm insert" ON public.player_missions FOR INSERT WITH CHECK (true);
CREATE POLICY "pm update" ON public.player_missions FOR UPDATE USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pm_touch BEFORE UPDATE ON public.player_missions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- REWARDS CATALOG
CREATE TABLE public.rewards (
  id text PRIMARY KEY,
  name text NOT NULL,
  reward_type text NOT NULL, -- cookie | brownie | voucher | gift
  description text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.rewards TO anon, authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards public read" ON public.rewards FOR SELECT USING (true);

-- PLAYER REWARDS INVENTORY
CREATE TABLE public.player_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_key text NOT NULL,
  reward_id text NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  source text, -- e.g. mission id or 'manual'
  earned_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.player_rewards TO anon, authenticated;
GRANT ALL ON public.player_rewards TO service_role;
ALTER TABLE public.player_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr read" ON public.player_rewards FOR SELECT USING (true);
CREATE POLICY "pr insert" ON public.player_rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "pr update" ON public.player_rewards FOR UPDATE USING (true) WITH CHECK (true);

-- UPDATE RANK THRESHOLDS
DELETE FROM public.ranks;
INSERT INTO public.ranks (id, name, min_xp, max_xp, rewards, display_order, accent) VALUES
  ('rookie', 'ROOKIE', 0, 499, '["Welcome kit","Basic access"]'::jsonb, 1, '#9CA3AF'),
  ('og',     'OG',     500, 2999, '["Priority supply","5% bonus gold"]'::jsonb, 2, '#7CFF4D'),
  ('black',  'BLACK',  3000, NULL, '["VIP couriers","Exclusive drops","Free brownie/month"]'::jsonb, 3, '#F5F5F5');

-- SEED MEMBERS (demo passwords)
INSERT INTO public.members (pass_id, password, player_name, character_id) VALUES
  ('BLACK001',  'black123',  'BLACK',  'char-01'),
  ('OG001',     'og123',     'REAPER', 'char-02'),
  ('ROOKIE001', 'rookie123', 'GHOST',  'char-03');

-- SEED MISSIONS
INSERT INTO public.missions (id, code, title, description, mission_type, metric, target_value, xp_reward, gold_reward, reward_id, display_order) VALUES
  ('m-buy-50g',      'BUY_50G',      'Buy 50g',        'Accumulate 50 grams in orders this week.',   'weekly',  'grams',  50,   250,  100, 'r-cookie',  1),
  ('m-spend-2000',   'SPEND_2000',   'Spend 2000 THB', 'Complete orders totaling 2000 THB.',          'weekly',  'thb',    2000, 300,  150, 'r-brownie', 2),
  ('m-buy-1kg',      'BUY_1KG',      'Buy 1kg',        'Reach 1000 grams in lifetime supply.',        'special', 'grams',  1000, 1000, 500, 'r-gift',    3),
  ('m-3-missions',   'THREE_OPS',    '3 Operations',   'Complete 3 successful orders.',               'weekly',  'orders', 3,    200,  80,  'r-voucher', 4);

-- SEED REWARDS
INSERT INTO public.rewards (id, name, reward_type, description, icon, display_order) VALUES
  ('r-cookie',  'Signature Cookie',  'cookie',  'Complimentary house cookie with next order.', '🍪', 1),
  ('r-brownie', 'Bunker Brownie',    'brownie', 'Complimentary bunker brownie.',                '🟫', 2),
  ('r-voucher', '10% Discount Voucher', 'voucher', 'Ten percent off your next mission.',        '🎟️', 3),
  ('r-gift',    'Special Gift Drop', 'gift',    'Exclusive gift drop from the bunker.',         '🎁', 4);
