create or replace function public.suggest_people(p_viewer uuid, p_limit int default 3)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  status text,
  branche text,
  ort text,
  score numeric
) language sql security definer set search_path = 'public' as $$
with
blocked as (
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
  select coalesce(branche,'') as u_branche, coalesce(ausbildungsberuf,'') as u_track, coalesce(status,'') as u_status, coalesce(ort,'') as u_ort
  from profiles where id = p_viewer
),
base as (
  select p.id,
         nullif(trim(coalesce(p.vorname,'') || ' ' || coalesce(p.nachname,'')), '') as display_name,
         p.avatar_url, p.status, p.branche, p.ort,
    (0
     + case when p.branche = u.u_branche or p.ausbildungsberuf = u.u_track then 40 else 0 end
     + case when p.status = u.u_status then 25 else 0 end
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
     + case when coalesce(p.ort,'') = u.u_ort then 10 else 0 end
    ) as score
  from profiles p
  cross join u
  where p.id not in (select id from blocked)
)
select * from base
order by score desc, random()
limit greatest(1, p_limit);
$$;