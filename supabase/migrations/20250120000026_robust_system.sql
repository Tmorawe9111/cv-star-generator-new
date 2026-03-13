-- Robust System Migration - Creates all necessary tables for stable operation
-- This migration ensures the system works even with minimal data

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create companies table if it doesn't exist
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  website text,
  description text,
  industry text,
  size text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create profiles table if it doesn't exist (main user profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  vorname text,
  nachname text,
  geburtsdatum date,
  telefon text,
  strasse text,
  hausnummer text,
  plz text,
  ort text,
  branche text,
  status text check (status in ('schueler', 'azubi', 'ausgelernt')),
  ausbildungsberuf text,
  ausbildungsbetrieb text,
  aktueller_beruf text,
  ueber_mich text,
  kenntnisse text,
  motivation text,
  profilbild_url text,
  profile_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create company_users table if it doesn't exist
create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member', 'viewer')) default 'member',
  created_at timestamptz default now(),
  unique(company_id, user_id)
);

-- Create job_postings table
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  requirements text,
  location text,
  salary_range text,
  employment_type text check (employment_type in ('full-time', 'part-time', 'contract', 'internship')),
  status text not null check (status in ('draft','published','closed')) default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create company_token_wallets table
create table if not exists public.company_token_wallets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz default now()
);

-- Create token_transactions table
create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  delta int not null,
  reason text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  idempotency_key text unique,
  created_at timestamptz default now()
);

-- Create profile_unlocks table
create table if not exists public.profile_unlocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('basic', 'contact')),
  job_posting_id uuid references public.job_postings(id) on delete set null,
  general_interest boolean default false,
  created_at timestamptz default now(),
  unique(company_id, profile_id, level)
);

-- Create data_access_log table
create table if not exists public.data_access_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  access_type text not null,
  job_posting_id uuid references public.job_postings(id) on delete set null,
  created_at timestamptz default now()
);

-- Create company_pipelines table
create table if not exists public.company_pipelines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  name text not null default 'Standard Pipeline',
  created_at timestamptz default now()
);

-- Create pipeline_stages table
create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.company_pipelines(id) on delete cascade,
  name text not null,
  position int not null,
  color text default '#3B82F6',
  created_at timestamptz default now()
);

-- Create pipeline_items table
create table if not exists public.pipeline_items (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.company_pipelines(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  job_posting_id uuid references public.job_postings(id) on delete set null,
  notes text,
  position int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_branche on public.profiles(branche);
create index if not exists idx_company_users_company on public.company_users(company_id);
create index if not exists idx_company_users_user on public.company_users(user_id);
create index if not exists idx_job_postings_company on public.job_postings(company_id);
create index if not exists idx_job_postings_status on public.job_postings(status);
create index if not exists idx_token_transactions_company on public.token_transactions(company_id);
create index if not exists idx_token_transactions_idempotency on public.token_transactions(idempotency_key);
create index if not exists idx_profile_unlocks_company_profile on public.profile_unlocks(company_id, profile_id);
create index if not exists idx_data_access_log_company on public.data_access_log(company_id);
create index if not exists idx_pipeline_items_pipeline on public.pipeline_items(pipeline_id);
create index if not exists idx_pipeline_items_stage on public.pipeline_items(stage_id);

-- Create RLS policies
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.company_users enable row level security;
alter table public.job_postings enable row level security;
alter table public.company_token_wallets enable row level security;
alter table public.token_transactions enable row level security;
alter table public.profile_unlocks enable row level security;
alter table public.data_access_log enable row level security;
alter table public.company_pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.pipeline_items enable row level security;

-- RLS Policies for profiles (public read, own write)
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for companies
create policy "Companies are viewable by everyone" on public.companies
  for select using (true);

create policy "Company users can update company" on public.companies
  for update using (
    exists (
      select 1 from public.company_users 
      where company_id = companies.id 
      and user_id = auth.uid()
    )
  );

-- RLS Policies for company_users
create policy "Company users can view company users" on public.company_users
  for select using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = company_users.company_id
      and cu.user_id = auth.uid()
    )
  );

-- RLS Policies for job_postings
create policy "Job postings are viewable by everyone" on public.job_postings
  for select using (true);

create policy "Company users can manage job postings" on public.job_postings
  for all using (
    exists (
      select 1 from public.company_users 
      where company_id = job_postings.company_id 
      and user_id = auth.uid()
    )
  );

-- RLS Policies for token system
create policy "Company users can view wallets" on public.company_token_wallets
  for select using (
    exists (
      select 1 from public.company_users 
      where company_id = company_token_wallets.company_id 
      and user_id = auth.uid()
    )
  );

create policy "Company users can view transactions" on public.token_transactions
  for select using (
    exists (
      select 1 from public.company_users 
      where company_id = token_transactions.company_id 
      and user_id = auth.uid()
    )
  );

create policy "Company users can view unlocks" on public.profile_unlocks
  for select using (
    exists (
      select 1 from public.company_users 
      where company_id = profile_unlocks.company_id 
      and user_id = auth.uid()
    )
  );

-- RLS Policies for pipeline system
create policy "Company users can view pipelines" on public.company_pipelines
  for select using (
    exists (
      select 1 from public.company_users 
      where company_id = company_pipelines.company_id 
      and user_id = auth.uid()
    )
  );

create policy "Company users can view pipeline stages" on public.pipeline_stages
  for select using (
    exists (
      select 1 from public.company_users cu
      join public.company_pipelines cp on cp.id = pipeline_stages.pipeline_id
      where cu.company_id = cp.company_id
      and cu.user_id = auth.uid()
    )
  );

create policy "Company users can view pipeline items" on public.pipeline_items
  for select using (
    exists (
      select 1 from public.company_users cu
      join public.company_pipelines cp on cp.id = pipeline_items.pipeline_id
      where cu.company_id = cp.company_id
      and cu.user_id = auth.uid()
    )
  );

-- Create helper functions
create or replace function public.rpc_get_company_id()
returns uuid
language plpgsql
security definer
as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id
  from public.company_users
  where user_id = auth.uid()
  limit 1;
  
  return v_company_id;
end;
$$;

-- Create function to ensure company has wallet
create or replace function public.ensure_company_wallet(p_company_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.company_token_wallets (company_id, balance)
  values (p_company_id, 100) -- Start with 100 tokens
  on conflict (company_id) do nothing;
end;
$$;

-- Create function to ensure company has default pipeline
create or replace function public.ensure_default_pipeline(p_company_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_pipeline_id uuid;
  v_stage_id1 uuid;
  v_stage_id2 uuid;
  v_stage_id3 uuid;
  v_stage_id4 uuid;
  v_stage_id5 uuid;
begin
  -- Create pipeline if it doesn't exist
  insert into public.company_pipelines (company_id, name)
  values (p_company_id, 'Standard Pipeline')
  on conflict (company_id) do nothing
  returning id into v_pipeline_id;
  
  -- Get existing pipeline if it exists
  if v_pipeline_id is null then
    select id into v_pipeline_id from public.company_pipelines where company_id = p_company_id;
  end if;
  
  -- Create default stages if they don't exist
  insert into public.pipeline_stages (pipeline_id, name, position, color)
  values 
    (v_pipeline_id, 'Neu', 1, '#3B82F6'),
    (v_pipeline_id, 'Kontaktiert', 2, '#10B981'),
    (v_pipeline_id, 'Interview', 3, '#F59E0B'),
    (v_pipeline_id, 'Angebot', 4, '#8B5CF6'),
    (v_pipeline_id, 'Abgelehnt', 5, '#EF4444')
  on conflict do nothing;
  
  return v_pipeline_id;
end;
$$;

-- Create masked profiles view for RLS
create or replace view public.profiles_masked as
select 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  p.geburtsdatum,
  p.telefon,
  p.strasse,
  p.hausnummer,
  p.plz,
  p.ort,
  p.branche,
  p.status,
  p.ausbildungsberuf,
  p.ausbildungsbetrieb,
  p.aktueller_beruf,
  p.ueber_mich,
  p.kenntnisse,
  p.motivation,
  p.profilbild_url,
  p.profile_complete,
  p.created_at,
  p.updated_at,
  -- Add unlock status for companies
  case 
    when auth.uid() is not null and exists (
      select 1 from public.company_users cu
      where cu.user_id = auth.uid()
    ) then true
    else false
  end as can_view_full_profile
from public.profiles p;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select on public.profiles_masked to anon, authenticated;
grant select on public.companies to anon, authenticated;
grant select on public.job_postings to anon, authenticated;
grant all on public.profiles to authenticated;
grant all on public.company_users to authenticated;
grant all on public.job_postings to authenticated;
grant all on public.company_token_wallets to authenticated;
grant all on public.token_transactions to authenticated;
grant all on public.profile_unlocks to authenticated;
grant all on public.data_access_log to authenticated;
grant all on public.company_pipelines to authenticated;
grant all on public.pipeline_stages to authenticated;
grant all on public.pipeline_items to authenticated;

-- Create trigger to automatically create wallet and pipeline for new companies
create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Create wallet
  perform public.ensure_company_wallet(new.id);
  
  -- Create default pipeline
  perform public.ensure_default_pipeline(new.id);
  
  return new;
end;
$$;

create trigger on_company_created
  after insert on public.companies
  for each row execute function public.handle_new_company();

-- Insert some sample data for testing
insert into public.companies (id, name, email, description, industry, location)
values 
  (gen_random_uuid(), 'Beispiel GmbH', 'info@beispiel.de', 'Ein Beispielunternehmen', 'IT', 'Berlin'),
  (gen_random_uuid(), 'Muster AG', 'kontakt@muster.de', 'Musterunternehmen', 'Handwerk', 'München')
on conflict do nothing;

-- Success message
do $$
begin
  raise notice 'Robust System Migration completed successfully!';
  raise notice 'All tables, policies, and functions created.';
  raise notice 'System is now ready for stable operation.';
end $$;
