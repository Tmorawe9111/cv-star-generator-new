-- 0) Ensure helper function for updated_at exists
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Trigger-Funktion: Subscription → Companies spiegeln (from prior approval)
create or replace function public.sync_company_from_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.companies c
     set active_tokens = new.token_balance,
         seats = new.seats,
         plan_type = new.plan_id,
         subscription_status = new.status,
         updated_at = now()
   where c.id = new.company_id;
  return new;
end;
$$;

drop trigger if exists tr_sync_company_from_subscription on public.company_subscriptions;
create trigger tr_sync_company_from_subscription
after insert or update of token_balance, seats, plan_id, status
on public.company_subscriptions
for each row
execute procedure public.sync_company_from_subscription();

-- Backfill current values
update public.companies c
set active_tokens = s.token_balance,
    seats = s.seats,
    plan_type = s.plan_id,
    subscription_status = s.status,
    updated_at = now()
from public.company_subscriptions s
where s.company_id = c.id;

-- Realtime setup for companies and subscriptions
alter table public.companies replica identity full;
alter table public.company_subscriptions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'companies'
  ) then
    execute 'alter publication supabase_realtime add table public.companies';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'company_subscriptions'
  ) then
    execute 'alter publication supabase_realtime add table public.company_subscriptions';
  end if;
end $$;

-- 2) Pipeline & activity schema for Company Dashboard
-- Table: company_candidates (pipeline items per company)
create table if not exists public.company_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null, -- references public.profiles(id)
  stage text not null default 'new' check (stage in ('new','contacted','interview','offer','hired','archived')),
  owner_user_id uuid,
  unlocked_by_user_id uuid,
  unlocked_at timestamptz default now(),
  last_touched_at timestamptz,
  next_action_at timestamptz,
  next_action_note text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_company_candidates_company foreign key (company_id) references public.companies(id) on delete cascade,
  constraint fk_company_candidates_profile foreign key (candidate_id) references public.profiles(id) on delete cascade
);

-- RLS
alter table public.company_candidates enable row level security;

-- Policies: members can read/insert/update; admins can delete
create policy if not exists "Company members can read pipeline"
  on public.company_candidates for select
  using (
    company_id in (
      select company_users.company_id from public.company_users where company_users.user_id = auth.uid()
    )
  );

create policy if not exists "Company members can insert pipeline"
  on public.company_candidates for insert
  with check (
    company_id in (
      select company_users.company_id from public.company_users where company_users.user_id = auth.uid()
    )
  );

create policy if not exists "Company members can update pipeline"
  on public.company_candidates for update
  using (
    company_id in (
      select company_users.company_id from public.company_users where company_users.user_id = auth.uid()
    )
  );

create policy if not exists "Company admins can delete pipeline"
  on public.company_candidates for delete
  using (public.is_company_admin(company_id));

-- Trigger for updated_at
create or replace trigger tr_company_candidates_updated_at
before update on public.company_candidates
for each row
execute procedure public.update_updated_at_column();

-- Indexes
create index if not exists idx_company_candidates_company_stage on public.company_candidates(company_id, stage);
create index if not exists idx_company_candidates_last_touched on public.company_candidates(company_id, last_touched_at desc);
create index if not exists idx_company_candidates_next_action on public.company_candidates(company_id, next_action_at);

-- Table: candidate_contacts (contact attempts + outcomes)
create table if not exists public.candidate_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null, -- references public.profiles(id)
  channel text not null, -- e.g., email/phone/whatsapp
  outcome text, -- e.g., reached/no-answer/positive/negative
  created_at timestamptz not null default now(),
  created_by uuid not null,
  constraint fk_candidate_contacts_company foreign key (company_id) references public.companies(id) on delete cascade,
  constraint fk_candidate_contacts_profile foreign key (candidate_id) references public.profiles(id) on delete cascade
);

alter table public.candidate_contacts enable row level security;

create policy if not exists "Company members can read contacts"
  on public.candidate_contacts for select
  using (public.has_company_access(company_id));

create policy if not exists "Members can insert contacts"
  on public.candidate_contacts for insert
  with check (public.has_company_access(company_id) and auth.uid() = created_by);

create policy if not exists "Authors can update contacts"
  on public.candidate_contacts for update
  using (auth.uid() = created_by);

create policy if not exists "Authors can delete contacts"
  on public.candidate_contacts for delete
  using (auth.uid() = created_by);

create index if not exists idx_candidate_contacts_company_candidate on public.candidate_contacts(company_id, candidate_id);
create index if not exists idx_candidate_contacts_created_at on public.candidate_contacts(company_id, created_at desc);

-- Table: candidate_notes (internal notes)
create table if not exists public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null, -- references public.profiles(id)
  body text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_candidate_notes_company foreign key (company_id) references public.companies(id) on delete cascade,
  constraint fk_candidate_notes_profile foreign key (candidate_id) references public.profiles(id) on delete cascade
);

alter table public.candidate_notes enable row level security;

create policy if not exists "Company members can read notes"
  on public.candidate_notes for select
  using (public.has_company_access(company_id));

create policy if not exists "Members can insert notes"
  on public.candidate_notes for insert
  with check (public.has_company_access(company_id) and auth.uid() = created_by);

create policy if not exists "Authors can update notes"
  on public.candidate_notes for update
  using (auth.uid() = created_by);

create policy if not exists "Authors can delete notes"
  on public.candidate_notes for delete
  using (auth.uid() = created_by);

create or replace trigger tr_candidate_notes_updated_at
before update on public.candidate_notes
for each row
execute procedure public.update_updated_at_column();

create index if not exists idx_candidate_notes_company_candidate on public.candidate_notes(company_id, candidate_id);
create index if not exists idx_candidate_notes_created_at on public.candidate_notes(company_id, created_at desc);

-- Table: company_activity (audit/timeline)
create table if not exists public.company_activity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  actor_user_id uuid not null,
  type text not null, -- e.g., unlocked, contacted, stage_moved, note_added
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint fk_company_activity_company foreign key (company_id) references public.companies(id) on delete cascade
);

alter table public.company_activity enable row level security;

create policy if not exists "Company members can read activity"
  on public.company_activity for select
  using (public.has_company_access(company_id));

create policy if not exists "Members can insert activity"
  on public.company_activity for insert
  with check (public.has_company_access(company_id) and auth.uid() = actor_user_id);

create index if not exists idx_company_activity_company_created on public.company_activity(company_id, created_at desc);

-- Realtime for new tables
alter table public.company_candidates replica identity full;
alter table public.candidate_contacts replica identity full;
alter table public.candidate_notes replica identity full;
alter table public.company_activity replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'company_candidates'
  ) then
    execute 'alter publication supabase_realtime add table public.company_candidates';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidate_contacts'
  ) then
    execute 'alter publication supabase_realtime add table public.candidate_contacts';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidate_notes'
  ) then
    execute 'alter publication supabase_realtime add table public.candidate_notes';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'company_activity'
  ) then
    execute 'alter publication supabase_realtime add table public.company_activity';
  end if;
end $$;