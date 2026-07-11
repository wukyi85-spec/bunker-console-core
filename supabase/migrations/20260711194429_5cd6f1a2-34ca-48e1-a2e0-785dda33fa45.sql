
-- ORDERS
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_number TEXT NOT NULL UNIQUE,
  player_key TEXT NOT NULL,
  player_name TEXT,
  character_id TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT NOT NULL,
  total_grams NUMERIC NOT NULL DEFAULT 0,
  product_total NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Processing',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  gold_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_player_key_idx ON public.orders(player_key, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders open read" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "orders open insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders open update" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- PLAYER STATS
CREATE TABLE public.player_stats (
  player_key TEXT PRIMARY KEY,
  player_name TEXT,
  character_id TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  activity INTEGER NOT NULL DEFAULT 0,
  current_rank TEXT NOT NULL DEFAULT 'Rookie',
  total_purchase NUMERIC NOT NULL DEFAULT 0,
  total_weight NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.player_stats TO anon, authenticated;
GRANT ALL ON public.player_stats TO service_role;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats open read" ON public.player_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "stats open insert" ON public.player_stats FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "stats open update" ON public.player_stats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- RANKS
CREATE TABLE public.ranks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  max_xp INTEGER,
  rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  accent TEXT
);
GRANT SELECT ON public.ranks TO anon, authenticated;
GRANT ALL ON public.ranks TO service_role;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks public read" ON public.ranks FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.ranks (id, name, min_xp, max_xp, rewards, display_order, accent) VALUES
  ('rookie', 'Rookie', 0, 4999, '["Access to Supply Room","Basic Supply Drops"]'::jsonb, 1, '#7CFF4D'),
  ('og', 'OG', 5000, 19999, '["Priority Supply Access","+5% Gold Bonus","Exclusive OG Drops"]'::jsonb, 2, '#FFB84D'),
  ('black', 'BLACK', 20000, NULL, '["VIP Concierge Access","+15% Gold Bonus","BLACK Tier Exclusive Missions"]'::jsonb, 3, '#FF4D6A');

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER player_stats_touch BEFORE UPDATE ON public.player_stats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
