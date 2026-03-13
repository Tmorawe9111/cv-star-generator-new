-- Fix linter: set search_path on SQL function
create or replace function public.get_token_unit_price_cents(qty int)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select unit_price_cents
  from public.token_pricing_tiers
  where active and min_qty <= qty
  order by min_qty desc
  limit 1
$$;