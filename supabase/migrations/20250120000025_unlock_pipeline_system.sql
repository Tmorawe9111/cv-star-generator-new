-- Two-Step Unlock System + Persistent Access + Token Accounting + Kanban Pipeline
-- Migration für cv-star-generator mit profiles statt candidate_profiles

-- JOBS (minimal)
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  status text not null check (status in ('draft','published','closed')) default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_job_postings_company_status on public.job_postings(company_id, status);

-- WALLET
create table if not exists public.company_token_wallets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz default now()
);
create or replace function public.tg_set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_wallet_updated on public.company_token_wallets;
create trigger trg_wallet_updated before update on public.company_token_wallets
for each row execute function public.tg_set_updated_at();

create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('purchase','unlock_basic','unlock_contact','manual_adjust')),
  profile_id uuid null references public.profiles(id) on delete set null,
  idempotency_key text unique null,
  created_at timestamptz default now()
);
create index if not exists idx_token_tx_company_created on public.token_transactions(company_id, created_at desc);

-- UNLOCKS (Two-level) - using profiles instead of candidate_profiles
create table if not exists public.profile_unlocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('basic','contact')),
  job_posting_id uuid null references public.job_postings(id) on delete set null,
  general_interest boolean not null default false,
  unlocked_at timestamptz not null default now(),
  unique (company_id, profile_id, level)
);
create index if not exists idx_pu_company_profile on public.profile_unlocks(company_id, profile_id);

-- ACCESS LOG
create table if not exists public.data_access_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  object_type text not null check (object_type in ('profile','attachment')),
  object_id text null,
  action text not null check (action in ('view','download')),
  at timestamptz default now()
);

-- PIPELINE (Kanban)
create table if not exists public.company_pipelines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  name text not null default 'Standard',
  created_at timestamptz default now()
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.company_pipelines(id) on delete cascade,
  name text not null,
  position int not null,
  created_at timestamptz default now(),
  unique (pipeline_id, position)
);

create table if not exists public.pipeline_items (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.company_pipelines(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  job_posting_id uuid null references public.job_postings(id) on delete set null,
  order_index int not null default 0,
  created_at timestamptz default now(),
  unique (pipeline_id, profile_id)
);
create index if not exists idx_pipeline_items_stage_order on public.pipeline_items(stage_id, order_index);

-- Default pipeline stages generator (safe upsert)
create or replace function public.ensure_default_pipeline(p_company uuid)
returns uuid
language plpgsql
as $$
declare
  pid uuid;
begin
  select id into pid from public.company_pipelines where company_id = p_company;
  if pid is null then
    insert into public.company_pipelines (company_id) values (p_company) returning id into pid;
    insert into public.pipeline_stages (pipeline_id, name, position) values
      (pid, 'Neu', 1),
      (pid, 'Kontaktiert', 2),
      (pid, 'Interview', 3),
      (pid, 'Angebot', 4),
      (pid, 'Abgelehnt', 5);
  end if;
  return pid;
end;
$$;

-- MASKING VIEW - adapted for profiles table structure
create or replace view public.profiles_masked as
select
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  p.full_name,
  p.status,
  p.branche,
  p.avatar_url,
  p.headline,
  p.employment_status,
  p.company_name,
  p.ausbildungsberuf,
  p.schule,
  p.ausbildungsbetrieb,
  p.aktueller_beruf,
  -- Basic fields (visible with basic unlock)
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.geburtsdatum else null
  end as geburtsdatum,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.strasse else null
  end as strasse,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.hausnummer else null
  end as hausnummer,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.plz else null
  end as plz,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.ort else null
  end as ort,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.sprachen else null
  end as sprachen,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.faehigkeiten else null
  end as faehigkeiten,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.schulbildung else null
  end as schulbildung,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level in ('basic','contact')
      where cu.user_id = auth.uid()
    ) then p.berufserfahrung else null
  end as berufserfahrung,
  -- Contact fields (visible with contact unlock)
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level = 'contact'
      where cu.user_id = auth.uid()
    ) then p.telefon else null
  end as telefon,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level = 'contact'
      where cu.user_id = auth.uid()
    ) then p.uebermich else null
  end as uebermich,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level = 'contact'
      where cu.user_id = auth.uid()
    ) then p.kenntnisse else null
  end as kenntnisse,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level = 'contact'
      where cu.user_id = auth.uid()
    ) then p.motivation else null
  end as motivation,
  case
    when exists (
      select 1 from company_users cu
      join profile_unlocks pu
        on pu.company_id = cu.company_id
       and pu.profile_id = p.id
       and pu.level = 'contact'
      where cu.user_id = auth.uid()
    ) then p.praktische_erfahrung else null
  end as praktische_erfahrung,
  p.created_at,
  p.updated_at
from public.profiles p;

-- RLS
alter table public.job_postings enable row level security;
alter table public.company_token_wallets enable row level security;
alter table public.token_transactions enable row level security;
alter table public.profile_unlocks enable row level security;
alter table public.data_access_log enable row level security;
alter table public.company_pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.pipeline_items enable row level security;

-- Policies (company scope via company_users)
create policy "job_postings_by_company" on public.job_postings
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = job_postings.company_id))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = job_postings.company_id));

create policy "wallet_company_scope" on public.company_token_wallets
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = company_token_wallets.company_id))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = company_token_wallets.company_id));

create policy "tx_company_scope" on public.token_transactions
  for select using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = token_transactions.company_id));

create policy "unlocks_company_scope" on public.profile_unlocks
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = profile_unlocks.company_id))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = profile_unlocks.company_id));

create policy "accesslog_company_scope" on public.data_access_log
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = data_access_log.company_id))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = data_access_log.company_id));

create policy "pipeline_company_scope" on public.company_pipelines
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = company_pipelines.company_id))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = company_pipelines.company_id));

create policy "pipeline_stages_scope" on public.pipeline_stages
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid()
    and cu.company_id = (select company_id from public.company_pipelines p where p.id = pipeline_stages.pipeline_id)))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid()
    and cu.company_id = (select company_id from public.company_pipelines p where p.id = pipeline_stages.pipeline_id)));

create policy "pipeline_items_scope" on public.pipeline_items
  for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = pipeline_items.company_id))
  with check (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = pipeline_items.company_id));

-- RPCs (idempotent, transactional)
create or replace function public.rpc_get_company_id()
returns uuid
language sql security definer
as $$
  select cu.company_id
  from public.company_users cu
  where cu.user_id = auth.uid()
  limit 1
$$;

create or replace function public.rpc_unlock_basic(p_profile uuid, p_idem text, p_job uuid, p_general boolean)
returns text
language plpgsql
security definer
as $$
declare
  v_company uuid;
  v_has_basic boolean;
  v_has_contact boolean;
begin
  select public.rpc_get_company_id() into v_company;
  if v_company is null then
    raise exception 'no_company';
  end if;

  -- If contact already exists → no-op
  select exists(select 1 from public.profile_unlocks where company_id=v_company and profile_id=p_profile and level='contact')
  into v_has_contact;
  if v_has_contact then
    return 'already_contact';
  end if;

  -- If basic already exists → no-op
  select exists(select 1 from public.profile_unlocks where company_id=v_company and profile_id=p_profile and level='basic')
  into v_has_basic;
  if v_has_basic then
    return 'already_basic';
  end if;

  -- Check wallet
  perform 1 from public.company_token_wallets w where w.company_id=v_company and w.balance >= 1;
  if not found then
    return 'insufficient_funds';
  end if;

  -- Tx
  perform pg_advisory_xact_lock(hashtext(coalesce(p_idem,''))); -- idempotency guard per tx
  update public.company_token_wallets set balance = balance - 1 where company_id=v_company;

  begin
    insert into public.token_transactions(company_id, delta, reason, profile_id, idempotency_key)
    values (v_company, -1, 'unlock_basic', p_profile, p_idem);
  exception when unique_violation then
    -- duplicate by idempotency_key → rollback wallet decrement
    update public.company_token_wallets set balance = balance + 1 where company_id=v_company;
    return 'idempotent_duplicate';
  end;

  insert into public.profile_unlocks(company_id, profile_id, level, job_posting_id, general_interest)
  values (v_company, p_profile, 'basic', p_job, coalesce(p_general,false));

  return 'unlocked_basic';
end;
$$;

create or replace function public.rpc_unlock_contact(p_profile uuid, p_idem text, p_job uuid, p_general boolean)
returns text
language plpgsql
security definer
as $$
declare
  v_company uuid;
  v_has_contact boolean;
begin
  select public.rpc_get_company_id() into v_company;
  if v_company is null then
    raise exception 'no_company';
  end if;

  select exists(select 1 from public.profile_unlocks where company_id=v_company and profile_id=p_profile and level='contact')
  into v_has_contact;
  if v_has_contact then
    return 'already_contact';
  end if;

  -- Check wallet (needs 2)
  perform 1 from public.company_token_wallets w where w.company_id=v_company and w.balance >= 2;
  if not found then
    return 'insufficient_funds';
  end if;

  perform pg_advisory_xact_lock(hashtext(coalesce(p_idem,'')));

  update public.company_token_wallets set balance = balance - 2 where company_id=v_company;

  begin
    insert into public.token_transactions(company_id, delta, reason, profile_id, idempotency_key)
    values (v_company, -2, 'unlock_contact', p_profile, p_idem);
  exception when unique_violation then
    update public.company_token_wallets set balance = balance + 2 where company_id=v_company;
    return 'idempotent_duplicate';
  end;

  insert into public.profile_unlocks(company_id, profile_id, level, job_posting_id, general_interest)
  values (v_company, p_profile, 'contact', p_job, coalesce(p_general,false));

  return 'unlocked_contact';
end;
$$;

create or replace function public.rpc_is_unlocked(p_profile uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_company uuid;
  v_basic boolean := false;
  v_contact boolean := false;
begin
  select public.rpc_get_company_id() into v_company;
  if v_company is null then
    return jsonb_build_object('basic', false, 'contact', false);
  end if;

  select exists(select 1 from public.profile_unlocks where company_id=v_company and profile_id=p_profile and level='basic')
    into v_basic;
  select exists(select 1 from public.profile_unlocks where company_id=v_company and profile_id=p_profile and level='contact')
    into v_contact;

  return jsonb_build_object('basic', v_basic, 'contact', v_contact);
end;
$$;

create or replace function public.rpc_log_access(p_profile uuid, p_object_type text, p_object_id text)
returns void
language plpgsql
security definer
as $$
declare v_company uuid;
begin
  select public.rpc_get_company_id() into v_company;
  if v_company is null then raise exception 'no_company'; end if;
  insert into public.data_access_log(company_id, profile_id, object_type, object_id, action)
  values (v_company, p_profile, object_type, p_object_id, case when p_object_type='attachment' then 'download' else 'view' end);
end;
$$;

-- Add tokens to wallet function
create or replace function public.add_tokens_to_wallet(p_amount int, p_reason text)
returns void
language plpgsql
security definer
as $$
declare
  v_company uuid;
begin
  select public.rpc_get_company_id() into v_company;
  if v_company is null then
    raise exception 'no_company';
  end if;

  -- Ensure wallet exists
  insert into public.company_token_wallets (company_id, balance)
  values (v_company, 0)
  on conflict (company_id) do nothing;

  -- Add tokens
  update public.company_token_wallets 
  set balance = balance + p_amount 
  where company_id = v_company;

  -- Log transaction
  insert into public.token_transactions(company_id, delta, reason, profile_id, idempotency_key)
  values (v_company, p_amount, p_reason, null, gen_random_uuid()::text);
end;
$$;
