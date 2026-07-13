
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pass_id text,
  ADD COLUMN IF NOT EXISTS order_items jsonb,
  ADD COLUMN IF NOT EXISTS total_price numeric;

CREATE INDEX IF NOT EXISTS orders_member_id_idx ON public.orders(member_id);
CREATE INDEX IF NOT EXISTS orders_pass_id_idx ON public.orders(pass_id);
