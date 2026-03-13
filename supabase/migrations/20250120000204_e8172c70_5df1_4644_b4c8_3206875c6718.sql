-- ENUMS
create type follow_entity as enum ('profile','company');
create type follow_status as enum ('pending','accepted','rejected','blocked');

-- FOLLOWS: generisches Follow-Objekt
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_type follow_entity not null,
  follower_id uuid not null,
  followee_type follow_entity not null,
  followee_id uuid not null,
  status follow_status not null default 'accepted', -- Default: sofort akzeptiert (z. B. Profile -> Company)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (follower_type, follower_id, followee_type, followee_id)
);

create index if not exists idx_follows_follower on follows(follower_type, follower_id);
create index if not exists idx_follows_followee on follows(followee_type, followee_id);
create index if not exists idx_follows_status on follows(status);

-- Glocke/Benachrichtigungs-Prefs für Profile bezogen auf Companies
create table if not exists company_follow_prefs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  bell text not null default 'highlights', -- 'off' | 'highlights' | 'all'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, company_id)
);

-- Optional: einfache Rate-Limit-Tabelle (Schlüssel: company -> requests/24h)
create table if not exists follow_request_counters (
  company_id uuid primary key references companies(id) on delete cascade,
  day date not null default (current_date),
  count int not null default 0,
  updated_at timestamptz not null default now()
);

-- Trigger für updated_at
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_follows_updated_at on follows;
create trigger trg_follows_updated_at
before update on follows
for each row execute function set_updated_at();

drop trigger if exists trg_company_follow_prefs_updated_at on company_follow_prefs;
create trigger trg_company_follow_prefs_updated_at
before update on company_follow_prefs
for each row execute function set_updated_at();

-- RLS einschalten
alter table follows enable row level security;
alter table company_follow_prefs enable row level security;
alter table follow_request_counters enable row level security;

-- RLS: FOLLOWS
-- Lesen: Beteiligte dürfen lesen
create policy "follows_participants_can_select"
on follows for select
using (
  (follower_type = 'profile' and follower_id = auth.uid()) or
  (followee_type  = 'profile' and followee_id = auth.uid()) or
  exists ( -- company admin darf für seine company lesen
    select 1 from company_users cu
    where ( (follower_type = 'company' and follower_id = cu.company_id)
         or (followee_type  = 'company' and followee_id = cu.company_id)
    ) and cu.user_id = auth.uid() and cu.role in ('admin', 'editor')
  )
);

-- Einfügen: Nur der Follower selbst darf eine Beziehung starten
create policy "follows_follower_can_insert"
on follows for insert
with check (
  (follower_type = 'profile' and follower_id = auth.uid())
  or exists (
    select 1 from company_users cu
    where follower_type = 'company' and follower_id = cu.company_id and cu.user_id = auth.uid() and cu.role in ('admin', 'editor')
  )
);

-- Update: Nur der Follower ODER das Followee-Ziel darf Status ändern (z. B. accept/reject)
create policy "follows_participants_can_update"
on follows for update
using (
  (follower_type = 'profile' and follower_id = auth.uid())
  or (followee_type  = 'profile' and followee_id = auth.uid())
  or exists (
    select 1 from company_users cu
    where ( (follower_type = 'company' and follower_id = cu.company_id)
         or (followee_type  = 'company' and followee_id = cu.company_id)
    ) and cu.user_id = auth.uid() and cu.role in ('admin', 'editor')
  )
)
with check (true);

-- Löschen: Follower darf entfolgen / Anfrage zurückziehen
create policy "follows_follower_can_delete"
on follows for delete
using (
  (follower_type = 'profile' and follower_id = auth.uid())
  or exists (
    select 1 from company_users cu
    where follower_type = 'company' and follower_id = cu.company_id and cu.user_id = auth.uid() and cu.role in ('admin', 'editor')
  )
);

-- RLS: company_follow_prefs
-- Lesen: nur Besitzer (Profile)
create policy "company_follow_prefs_owner_select"
on company_follow_prefs for select
using (profile_id = auth.uid());

-- Insert/Update: nur Besitzer (Profile)
create policy "company_follow_prefs_owner_upsert"
on company_follow_prefs for insert
with check (profile_id = auth.uid());

create policy "company_follow_prefs_owner_update"
on company_follow_prefs for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- follow_request_counters (nur serverseitig via Edge Functions)
create policy "follow_request_counters_service_only"
on follow_request_counters for all
using (false)
with check (false);