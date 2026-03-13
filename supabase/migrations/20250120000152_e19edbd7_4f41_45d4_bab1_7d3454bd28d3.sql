-- Retry: remove IF NOT EXISTS from CREATE POLICY
create extension if not exists pgcrypto;

-- Ensure base tables exist (from previous step); create if missing
create table if not exists public.plans (
  id text primary key,
  name text not null,
  monthly_price_cents int not null,
  included_seats int not null default 1,
  included_tokens int not null default 0,
  max_seats int not null default 100,
  active boolean not null default true
);

insert into public.plans (id, name, monthly_price_cents, included_seats, included_tokens, max_seats)
values
('starter','Starter',   9900, 1,   0, 20),
('growth','Growth',    29900, 5, 100, 50),
('pro',   'Pro',       79900,15, 400,200)
on conflict (id) do nothing;

create table if not exists public.company_subscriptions (
  company_id uuid primary key references public.companies(id) on delete cascade,
  plan_id text not null references public.plans(id),
  seats int not null default 1,
  token_balance int not null default 0,
  renews_at timestamptz,
  status text not null default 'active',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_company_subscriptions_plan on public.company_subscriptions(plan_id);

create table if not exists public.token_pricing_tiers (
  id bigserial primary key,
  min_qty int not null,
  unit_price_cents int not null,
  active boolean not null default true
);

insert into public.token_pricing_tiers (min_qty, unit_price_cents) values
(   1, 120),
(  50, 100),
( 200,  80),
(1000,  60)
on conflict do nothing;

create table if not exists public.seat_pricing_tiers (
  id bigserial primary key,
  plan_id text not null references public.plans(id),
  min_seats int not null,
  seat_price_cents int not null,
  active boolean not null default true
);

insert into public.seat_pricing_tiers (plan_id, min_seats, seat_price_cents) values
('starter', 1, 1500), ('starter', 5, 1200), ('starter', 10, 1000),
('growth',  5, 1200), ('growth', 10, 1000), ('growth', 20,  900),
('pro',    15, 1000), ('pro',    30,  900), ('pro',   60,  800)
on conflict do nothing;

create table if not exists public.token_ledger (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  delta int not null,
  reason text not null,
  ref text,
  client_request_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_token_ledger_company on public.token_ledger(company_id);

create table if not exists public.seat_ledger (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  delta int not null,
  reason text not null,
  client_request_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_changes (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  from_plan text references public.plans(id),
  to_plan text not null references public.plans(id),
  client_request_id uuid,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.company_subscriptions
    add constraint company_subscriptions_non_negative
    check (seats >= 0 and token_balance >= 0);
exception when duplicate_object then null; end $$;

alter table public.company_subscriptions enable row level security;
alter table public.token_ledger         enable row level security;
alter table public.seat_ledger          enable row level security;
alter table public.plan_changes         enable row level security;

create or replace function public.has_company_access(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id = _company_id
  );
$$;

-- Create policies (no IF NOT EXISTS)
create policy "Company members can read subscription"
  on public.company_subscriptions for select
  using (public.has_company_access(company_id));

create policy "Company members can read token ledger"
  on public.token_ledger for select
  using (public.has_company_access(company_id));

create policy "Company members can read seat ledger"
  on public.seat_ledger for select
  using (public.has_company_access(company_id));

create policy "Company members can read plan changes"
  on public.plan_changes for select
  using (public.has_company_access(company_id));

revoke insert, update, delete on public.company_subscriptions from anon, authenticated;
revoke insert, update, delete on public.token_ledger         from anon, authenticated;
revoke insert, update, delete on public.seat_ledger          from anon, authenticated;
revoke insert, update, delete on public.plan_changes         from anon, authenticated;

alter table public.plans enable row level security;
create policy "Plans readable by everyone"
  on public.plans for select using (true);

alter table public.token_pricing_tiers enable row level security;
create policy "Token pricing readable by everyone"
  on public.token_pricing_tiers for select using (active);

alter table public.seat_pricing_tiers enable row level security;
create policy "Seat pricing readable by everyone"
  on public.seat_pricing_tiers for select using (active);

-- RPCs
create or replace function public.get_token_unit_price_cents(qty int)
returns int language sql stable as $$
  select unit_price_cents
  from public.token_pricing_tiers
  where active and min_qty <= qty
  order by min_qty desc
  limit 1
$$;

create or replace function public.purchase_tokens(
  _company_id uuid,
  _qty int,
  _client_request_id uuid default null
) returns table(new_balance int, paid_cents int)
language plpgsql security definer
set search_path = ''
as $$
declare
  unit_cents int;
  total_cents int;
  cur_balance int;
begin
  if not public.has_company_access(_company_id) then
    raise exception 'ACCESS_DENIED';
  end if;

  if _qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  if _client_request_id is not null and exists (
    select 1 from public.token_ledger
    where company_id = _company_id and client_request_id = _client_request_id and delta > 0
  ) then
    select token_balance into cur_balance from public.company_subscriptions where company_id = _company_id;
    return query select cur_balance, 0;
  end if;

  select public.get_token_unit_price_cents(_qty) into unit_cents;
  if unit_cents is null then
    raise exception 'No pricing tier configured';
  end if;
  total_cents := unit_cents * _qty;

  perform pg_advisory_xact_lock(hashtext(_company_id::text));

  update public.company_subscriptions
  set token_balance = token_balance + _qty,
      updated_at = now()
  where company_id = _company_id
  returning token_balance into cur_balance;

  if cur_balance is null then
    insert into public.company_subscriptions(company_id, plan_id, seats, token_balance, status)
    values (_company_id, 'starter', 1, _qty, 'active')
    on conflict (company_id) do update set token_balance = public.company_subscriptions.token_balance + excluded.token_balance,
                                        updated_at = now()
    returning token_balance into cur_balance;
  end if;

  insert into public.token_ledger(company_id, delta, reason, ref, client_request_id)
  values (_company_id, _qty, 'purchase', null, _client_request_id);

  return query select cur_balance, total_cents;
end $$;

create or replace function public.consume_tokens(
  _company_id uuid,
  _qty int,
  _reason text,
  _ref text default null,
  _client_request_id uuid default null
) returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  cur_balance int;
begin
  if not public.has_company_access(_company_id) then
    raise exception 'ACCESS_DENIED';
  end if;

  if _qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  if _client_request_id is not null and exists (
    select 1 from public.token_ledger
    where company_id = _company_id and client_request_id = _client_request_id and delta = -_qty
  ) then
    select token_balance into cur_balance from public.company_subscriptions where company_id = _company_id;
    return cur_balance;
  end if;

  perform pg_advisory_xact_lock(hashtext(_company_id::text));

  update public.company_subscriptions
  set token_balance = token_balance - _qty,
      updated_at = now()
  where company_id = _company_id
    and token_balance >= _qty
  returning token_balance into cur_balance;

  if cur_balance is null then
    raise exception 'Insufficient tokens';
  end if;

  insert into public.token_ledger(company_id, delta, reason, ref, client_request_id)
  values (_company_id, -_qty, coalesce(_reason,'consume'), _ref, _client_request_id);

  return cur_balance;
end $$;

create or replace function public.add_seats(
  _company_id uuid,
  _add int,
  _client_request_id uuid default null
) returns table(new_seats int, paid_cents int)
language plpgsql security definer
set search_path = ''
as $$
declare
  cur_plan text;
  cur_seats int;
  max_seats int;
  price_cents int;
begin
  if not public.has_company_access(_company_id) then
    raise exception 'ACCESS_DENIED';
  end if;

  if _add <= 0 then raise exception 'Add seats must be positive'; end if;

  if _client_request_id is not null and exists (
    select 1 from public.seat_ledger
    where company_id = _company_id and client_request_id = _client_request_id and delta = _add
  ) then
    select seats into cur_seats from public.company_subscriptions where company_id = _company_id;
    return query select cur_seats, 0;
  end if;

  select plan_id, seats into cur_plan, cur_seats
  from public.company_subscriptions where company_id = _company_id;

  if cur_plan is null then
    insert into public.company_subscriptions(company_id, plan_id, seats, token_balance, status)
    values (_company_id, 'starter', 1, 0, 'active')
    on conflict (company_id) do nothing;
    select plan_id, seats into cur_plan, cur_seats from public.company_subscriptions where company_id = _company_id;
  end if;

  select p.max_seats into max_seats from public.plans p where p.id = cur_plan;
  if cur_seats + _add > max_seats then
    raise exception 'Seat limit exceeded for plan %', cur_plan;
  end if;

  select spt.seat_price_cents into price_cents
  from public.seat_pricing_tiers spt
  where spt.plan_id = cur_plan and spt.min_seats <= (cur_seats + _add) and spt.active
  order by spt.min_seats desc limit 1;

  if price_cents is null then raise exception 'No seat pricing configured'; end if;

  perform pg_advisory_xact_lock(hashtext(_company_id::text));

  update public.company_subscriptions
  set seats = seats + _add,
      updated_at = now()
  where company_id = _company_id
  returning seats into cur_seats;

  insert into public.seat_ledger(company_id, delta, reason, client_request_id)
  values (_company_id, _add, 'purchase', _client_request_id);

  return query select cur_seats, price_cents * _add;
end $$;

create or replace function public.change_plan(
  _company_id uuid,
  _to_plan text,
  _client_request_id uuid default null
) returns table(plan_id text, seats int, token_balance int)
language plpgsql security definer
set search_path = ''
as $$
declare
  from_plan text;
  inc_seats int;
  inc_tokens int;
  cur_seats int;
  cur_tokens int;
begin
  if not public.has_company_access(_company_id) then
    raise exception 'ACCESS_DENIED';
  end if;

  if not exists (select 1 from public.plans where id = _to_plan and active) then
    raise exception 'Unknown or inactive plan %', _to_plan;
  end if;

  if _client_request_id is not null and exists (
    select 1 from public.plan_changes
    where company_id = _company_id and client_request_id = _client_request_id and to_plan = _to_plan
  ) then
    return query select plan_id, seats, token_balance from public.company_subscriptions where company_id = _company_id;
  end if;

  select plan_id into from_plan from public.company_subscriptions where company_id = _company_id;

  if from_plan is null then
    insert into public.company_subscriptions(company_id, plan_id, seats, token_balance, status)
    values (_company_id, _to_plan, 1, 0, 'active')
    on conflict (company_id) do update set plan_id = excluded.plan_id, updated_at = now();
  end if;

  select included_seats, included_tokens into inc_seats, inc_tokens from public.plans where id = _to_plan;

  perform pg_advisory_xact_lock(hashtext(_company_id::text));

  update public.company_subscriptions
  set plan_id = _to_plan,
      seats = greatest(seats, inc_seats),
      token_balance = token_balance + inc_tokens,
      updated_at = now()
  where company_id = _company_id
  returning plan_id, seats, token_balance into plan_id, cur_seats, cur_tokens;

  insert into public.plan_changes(company_id, from_plan, to_plan, client_request_id)
  values (_company_id, from_plan, _to_plan, _client_request_id);

  return query select plan_id, cur_seats, cur_tokens;
end $$;