
-- 1) Helper: is viewer a company member?
create or replace function public.viewer_is_company_member(p_viewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users cu
    where cu.user_id = p_viewer_id
  );
$$;

grant execute on function public.viewer_is_company_member(uuid) to anon, authenticated;

-- 2) First-degree follows (accounts the viewer follows and are accepted)
create or replace function public.viewer_first_degree(p_viewer_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select f.following_id
  from public.follows f
  where f.follower_id = p_viewer_id
    and f.status = 'accepted';
$$;

grant execute on function public.viewer_first_degree(uuid) to anon, authenticated;

-- 3) Second-degree follows (followers of the ones I follow), excluding self and already-first-degree
create or replace function public.viewer_second_degree(p_viewer_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  with first_deg as (
    select following_id
    from public.follows
    where follower_id = p_viewer_id
      and status = 'accepted'
  )
  select distinct f2.follower_id
  from public.follows f2
  join first_deg fd on f2.following_id = fd.following_id
  where f2.status = 'accepted'
    and f2.follower_id <> p_viewer_id
    and not exists (
      select 1
      from first_deg fd2
      where fd2.following_id = f2.follower_id
    );
$$;

grant execute on function public.viewer_second_degree(uuid) to anon, authenticated;

-- 4) Visibility + graph check
-- Rules:
-- - Only published posts are visible in feed
-- - Community viewer: visibility in ('CommunityOnly','CommunityAndCompanies')
-- - Company viewer: visibility must be 'CommunityAndCompanies'
-- - Graph: author = self OR first-degree OR limited second-degree
create or replace function public.can_view_post(p_post_id uuid, p_viewer_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_post record;
  v_is_company boolean;
  v_visibility_ok boolean;
  v_graph_ok boolean;
begin
  if p_viewer_id is null then
    return false;
  end if;

  select id, user_id as author_id, status, visibility, published_at
  into v_post
  from public.posts
  where id = p_post_id;

  if v_post.id is null then
    return false;
  end if;

  -- Only published posts are feed-visible
  if v_post.status <> 'published' then
    -- Optional: allow authors to view their own drafts in other contexts
    return false;
  end if;

  v_is_company := public.viewer_is_company_member(p_viewer_id);

  if v_is_company then
    v_visibility_ok := (v_post.visibility = 'CommunityAndCompanies');
  else
    v_visibility_ok := (v_post.visibility in ('CommunityOnly','CommunityAndCompanies'));
  end if;

  -- Graph (1st + limited 2nd degree) or author = self
  v_graph_ok :=
       (v_post.author_id = p_viewer_id)
    or (v_post.author_id in (select * from public.viewer_first_degree(p_viewer_id)))
    or (v_post.author_id in (select * from public.viewer_second_degree(p_viewer_id)));

  return (v_visibility_ok and v_graph_ok);
end;
$$;

grant execute on function public.can_view_post(uuid, uuid) to anon, authenticated;

-- 5) Feed RPC with cursor (published_at,id)
-- Use: select * from public.get_feed(viewer_id := auth.uid(), after_published := null, after_id := null, page_size := 20);
create or replace function public.get_feed(
  viewer_id uuid,
  after_published timestamptz default null,
  after_id uuid default null,
  page_size int default 20
)
returns setof public.posts
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select p.*
    from public.posts p
    where p.status = 'published'
      and public.can_view_post(p.id, viewer_id) = true
  ),
  filtered as (
    select *
    from base
    where
      -- cursor filter (published_at,id) < (after_published,after_id)
      case
        when after_published is null then true
        when after_published is not null and after_id is null then (published_at < after_published)
        else (published_at < after_published) or (published_at = after_published and id < after_id)
      end
  )
  select *
  from filtered
  order by published_at desc nulls last, id desc
  limit greatest(1, coalesce(page_size, 20));
$$;

grant execute on function public.get_feed(uuid, timestamptz, uuid, int) to anon, authenticated;

-- 6) Indexes to support feed queries
create index if not exists idx_posts_published_only_ts_id
  on public.posts (published_at desc, id desc)
  where status = 'published';

create index if not exists idx_posts_author_published_ts
  on public.posts (user_id, published_at desc)
  where status = 'published';

-- 7) Realtime robustness for posts
alter table public.posts replica identity full;

do $$
begin
  -- Add to realtime publication if not already present
  begin
    alter publication supabase_realtime add table public.posts;
  exception
    when duplicate_object then
      -- already added
      null;
  end;
end$$;
