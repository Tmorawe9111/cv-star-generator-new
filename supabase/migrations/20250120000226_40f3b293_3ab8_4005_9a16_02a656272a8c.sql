-- Drop and recreate functions with correct column references
DROP FUNCTION IF EXISTS suggest_companies(uuid, integer);
DROP FUNCTION IF EXISTS viewer_first_degree(uuid);
DROP FUNCTION IF EXISTS viewer_second_degree(uuid);

-- Fix the suggest_companies function to use correct follow table structure
CREATE OR REPLACE FUNCTION suggest_companies(p_viewer uuid, p_limit integer DEFAULT 12)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  industry text,
  main_location text,
  score integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
with
blocked as (
  select followee_id from follows 
  where follower_id = p_viewer 
    and follower_type = 'profile' 
    and followee_type = 'company'
  union
  select target_id from suggestions_history
   where profile_id = p_viewer and target_type = 'company'
     and last_seen_at > now() - interval '24 hours'
),
u as (select coalesce(branche,'') as u_branche, coalesce(ort,'') as u_ort from profiles where id=p_viewer),
base as (
  select c.id, c.name, c.logo_url, c.industry, c.main_location,
    (0
     + case when coalesce(c.industry,'') = u.u_branche then 35 else 0 end
     + least(20, coalesce((
         select 5 * count(*) from follows cf
         where cf.followee_id = c.id
           and cf.follower_type = 'profile'
           and cf.followee_type = 'company'
           and cf.status = 'accepted'
           and cf.follower_id in (
             select case when requester_id = p_viewer then addressee_id else requester_id end
             from connections
             where (requester_id = p_viewer or addressee_id = p_viewer)
               and status='accepted'
           )
       ), 0))
     + case when coalesce(c.main_location,'') = u.u_ort then 15 else 0 end
    ) as score
  from companies c
  cross join u
  where c.id not in (select followee_id from blocked)
    and c.account_status = 'active'
)
select * from base
order by score desc, random()
limit greatest(1, p_limit);
$$;

-- Fix other functions that might reference following_id
CREATE OR REPLACE FUNCTION viewer_first_degree(p_viewer uuid)
RETURNS TABLE (id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select followee_id as id from follows 
  where follower_id = p_viewer 
    and follower_type = 'profile' 
    and followee_type = 'profile'
    and status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION viewer_second_degree(p_viewer uuid)
RETURNS TABLE (id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select f2.followee_id as id 
  from follows f1
  join follows f2 on f2.follower_id = f1.followee_id
  where f1.follower_id = p_viewer
    and f1.follower_type = 'profile'
    and f1.followee_type = 'profile'
    and f1.status = 'accepted'
    and f2.follower_type = 'profile'
    and f2.followee_type = 'profile'
    and f2.status = 'accepted'
    and f2.followee_id != p_viewer;
$$;