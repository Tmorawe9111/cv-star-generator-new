-- Suggestions history table
create table if not exists public.suggestions_history(
  profile_id uuid not null,
  target_type text check (target_type in ('profile','company')) not null,
  target_id uuid not null,
  last_seen_at timestamptz not null default now(),
  primary key(profile_id, target_type, target_id)
);

-- Enable RLS
alter table public.suggestions_history enable row level security;

-- Restrict selects to owner
create policy "Users can view their own suggestion history"
  on public.suggestions_history
  for select
  to authenticated
  using (auth.uid() = profile_id);

-- Block direct writes from clients (writes happen via security definer function)
create policy "No direct writes to suggestions_history"
  on public.suggestions_history
  for all
  to authenticated
  using (false)
  with check (false);

-- RPC to mark an item as seen (24h rotation handled client by calling this on skip/connect/follow)
create or replace function public.suggestions_touch(p_viewer uuid, p_type text, p_target uuid)
returns void language sql security definer set search_path = 'public' as $$
  insert into public.suggestions_history(profile_id, target_type, target_id, last_seen_at)
  values (p_viewer, p_type, p_target, now())
  on conflict (profile_id, target_type, target_id)
  do update set last_seen_at = excluded.last_seen_at;
$$;

-- People suggestions
create or replace function public.suggest_people(p_viewer uuid, p_limit int default 3)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  role text,
  industry text,
  bundesland text,
  score numeric
) language sql security definer set search_path = 'public' as $$
with
blocked as (
  -- exclude me, existing connections or requests, and recently shown
  select addressee_id as id from connections where requester_id = p_viewer
  union
  select requester_id from connections where addressee_id = p_viewer
  union
  select target_id from suggestions_history
   where profile_id = p_viewer and target_type = 'profile'
     and last_seen_at > now() - interval '24 hours'
  union
  select p_viewer
),
u as (
  select industry as u_industry, role as u_role, bundesland as u_state from profiles where id = p_viewer
),
base as (
  select p.id, p.display_name, p.avatar_url, p.role, p.industry, p.bundesland,
    (0
     + case when p.industry = u.u_industry then 40 else 0 end
     + case when p.role = u.u_role then 25 else 0 end
     + least(15, coalesce((
         select 3 * count(*) from connections c1
         where c1.status = 'accepted' and (
           (c1.requester_id = p_viewer and c1.addressee_id in (
             select case when c2.requester_id = p.id then c2.addressee_id else c2.requester_id end
             from connections c2
             where (c2.requester_id = p.id or c2.addressee_id = p.id) and c2.status = 'accepted'
           ))
           or
           (c1.addressee_id = p_viewer and c1.requester_id in (
             select case when c2.requester_id = p.id then c2.addressee_id else c2.requester_id end
             from connections c2
             where (c2.requester_id = p.id or c2.addressee_id = p.id) and c2.status = 'accepted'
           ))
         )
       ), 0))
     + case when p.bundesland = u.u_state then 10 else 0 end
     + case when p.last_active_at > now() - interval '7 days' then 10 else 0 end
    ) as score
  from profiles p
  cross join u
  where p.id not in (select id from blocked)
)
select * from base
order by score desc, random()
limit greatest(1, p_limit);
$$;

-- Company suggestions
create or replace function public.suggest_companies(p_viewer uuid, p_limit int default 3)
returns table (
  id uuid,
  name text,
  logo_url text,
  industry text,
  bundesland text,
  score numeric
) language sql security definer set search_path = 'public' as $$
with
blocked as (
  select company_id from company_follows where user_id = p_viewer
  union
  select target_id from suggestions_history
   where profile_id = p_viewer and target_type = 'company'
     and last_seen_at > now() - interval '24 hours'
),
u as (select role, industry, bundesland from profiles where id=p_viewer),
base as (
  select c.id, c.name, c.logo_url, c.industry, c.bundesland,
    (0
     + case when c.industry = u.industry then 35 else 0 end
     + least(20, coalesce((
         select 5 * count(*) from company_follows cf
         where cf.company_id = c.id
           and cf.user_id in (
             select case when requester_id = p_viewer then addressee_id else requester_id end
             from connections
             where (requester_id = p_viewer or addressee_id = p_viewer)
               and status='accepted'
           )
       ), 0))
     + case when c.bundesland = u.bundesland then 15 else 0 end
     + case when c.last_active_at > now() - interval '14 days' then 15 else 0 end
     + case when coalesce(c.hiring_flag,false) then 15 else 0 end
    ) as score
  from companies c
  cross join u
  where c.id not in (select company_id from blocked)
)
select * from base
order by score desc, random()
limit greatest(1, p_limit);
$$;