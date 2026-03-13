
-- 1) Visibility helper for posts
create or replace function public.can_view_post(_post_id uuid, _viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with p as (
    select id, user_id, visibility
    from public.posts
    where id = _post_id
  )
  select coalesce(
    -- public/community visibility (support existing text variants)
    exists (select 1 from p where visibility in ('CommunityAndCompanies','public','Public')),
    false
  )
  or
  -- author can always see
  exists (select 1 from p where user_id = _viewer)
  or
  -- followers can see (if you later add visibility='followers', this still allows viewing when following)
  exists (
    select 1
    from p
    join public.follows f on f.following_id = p.user_id
    where f.follower_id = _viewer and f.status = 'accepted'
  );
$$;

-- 2) Feed RPC: returns published & visible posts for a viewer with cursor pagination
create or replace function public.get_feed(
  viewer_id uuid,
  after_published timestamptz default null,
  after_id uuid default null,
  limit_count int default 20
)
returns table (
  id uuid,
  content text,
  image_url text,
  user_id uuid,
  published_at timestamptz,
  created_at timestamptz,
  status text,
  link_url text,
  visibility text
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible_posts as (
    select p.*
    from public.posts p
    where p.status = 'published'
      and public.can_view_post(p.id, viewer_id)
  ),
  paged as (
    select *
    from visible_posts
    where
      (after_published is null and after_id is null)
      or ( (published_at, id) < (after_published, after_id) )
    order by published_at desc, id desc
    limit coalesce(limit_count, 20)
  )
  select id, content, image_url, user_id, published_at, created_at, status, link_url, visibility
  from paged
  order by published_at desc, id desc;
$$;

-- 3) Interactions: comments, likes, reposts, views

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  parent_comment_id uuid null references public.post_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;

create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
create index if not exists post_comments_user_id_idx on public.post_comments(user_id);
create index if not exists post_comments_parent_idx on public.post_comments(parent_comment_id);

create or replace function public.touch_post_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_post_comment_touch on public.post_comments;
create trigger trg_post_comment_touch
before update on public.post_comments
for each row execute function public.touch_post_comment_updated_at();

-- RLS policies for comments
drop policy if exists "Comments: can select visible post comments" on public.post_comments;
create policy "Comments: can select visible post comments"
on public.post_comments
for select
using ( public.can_view_post(post_id, auth.uid()) );

drop policy if exists "Comments: can insert own comments on visible posts" on public.post_comments;
create policy "Comments: can insert own comments on visible posts"
on public.post_comments
for insert
with check ( auth.uid() = user_id and public.can_view_post(post_id, auth.uid()) );

drop policy if exists "Comments: can update own comments" on public.post_comments;
create policy "Comments: can update own comments"
on public.post_comments
for update
using ( auth.uid() = user_id );

drop policy if exists "Comments: can delete own comments" on public.post_comments;
create policy "Comments: can delete own comments"
on public.post_comments
for delete
using ( auth.uid() = user_id );

-- Likes
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
alter table public.post_likes enable row level security;

create index if not exists post_likes_post_id_idx on public.post_likes(post_id);
create index if not exists post_likes_user_id_idx on public.post_likes(user_id);

drop policy if exists "Likes: can select for visible posts" on public.post_likes;
create policy "Likes: can select for visible posts"
on public.post_likes
for select
using ( public.can_view_post(post_id, auth.uid()) );

drop policy if exists "Likes: can like visible posts" on public.post_likes;
create policy "Likes: can like visible posts"
on public.post_likes
for insert
with check ( auth.uid() = user_id and public.can_view_post(post_id, auth.uid()) );

drop policy if exists "Likes: can unlike own like" on public.post_likes;
create policy "Likes: can unlike own like"
on public.post_likes
for delete
using ( auth.uid() = user_id );

-- Reposts
create table if not exists public.post_reposts (
  id uuid primary key default gen_random_uuid(),
  orig_post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (orig_post_id, user_id)
);
alter table public.post_reposts enable row level security;

create index if not exists post_reposts_post_id_idx on public.post_reposts(orig_post_id);
create index if not exists post_reposts_user_id_idx on public.post_reposts(user_id);

drop policy if exists "Reposts: can select for visible posts" on public.post_reposts;
create policy "Reposts: can select for visible posts"
on public.post_reposts
for select
using ( public.can_view_post(orig_post_id, auth.uid()) );

drop policy if exists "Reposts: can insert on visible posts" on public.post_reposts;
create policy "Reposts: can insert on visible posts"
on public.post_reposts
for insert
with check ( auth.uid() = user_id and public.can_view_post(orig_post_id, auth.uid()) );

drop policy if exists "Reposts: can delete own repost" on public.post_reposts;
create policy "Reposts: can delete own repost"
on public.post_reposts
for delete
using ( auth.uid() = user_id );

-- Views (simple unique impression per user)
create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
alter table public.post_views enable row level security;

create index if not exists post_views_post_id_idx on public.post_views(post_id);
create index if not exists post_views_user_id_idx on public.post_views(user_id);

drop policy if exists "Views: can select for visible posts" on public.post_views;
create policy "Views: can select for visible posts"
on public.post_views
for select
using ( public.can_view_post(post_id, auth.uid()) );

drop policy if exists "Views: can insert for visible posts" on public.post_views;
create policy "Views: can insert for visible posts"
on public.post_views
for insert
with check ( auth.uid() = user_id and public.can_view_post(post_id, auth.uid()) );

-- 4) Messaging schema

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);
alter table public.conversations enable row level security;

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);
alter table public.conversation_participants enable row level security;

create index if not exists conv_part_conv_idx on public.conversation_participants(conversation_id);
create index if not exists conv_part_user_idx on public.conversation_participants(user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text,
  attachments jsonb not null default '[]'::jsonb,
  reply_to_message_id uuid null references public.messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
alter table public.messages enable row level security;

create index if not exists messages_conv_idx on public.messages(conversation_id);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists messages_created_idx on public.messages(created_at);

create table if not exists public.message_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  unique (message_id, user_id)
);
alter table public.message_receipts enable row level security;

create index if not exists msg_receipts_msg_idx on public.message_receipts(message_id);
create index if not exists msg_receipts_user_idx on public.message_receipts(user_id);

-- Helper functions to avoid recursive RLS

create or replace function public.has_conversation_access(_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = _conversation_id
      and cp.user_id = auth.uid()
  );
$$;

create or replace function public.is_conversation_creator(_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = _conversation_id
      and c.created_by = auth.uid()
  );
$$;

create or replace function public.can_access_message(_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_conversation_access(m.conversation_id)
  from public.messages m
  where m.id = _message_id;
$$;

-- RLS for conversations
drop policy if exists "Conv: select if participant" on public.conversations;
create policy "Conv: select if participant"
on public.conversations
for select
using ( public.has_conversation_access(id) );

drop policy if exists "Conv: insert by creator" on public.conversations;
create policy "Conv: insert by creator"
on public.conversations
for insert
with check ( auth.uid() = created_by );

drop policy if exists "Conv: update if participant" on public.conversations;
create policy "Conv: update if participant"
on public.conversations
for update
using ( public.has_conversation_access(id) );

-- RLS for conversation_participants
drop policy if exists "Participants: select in own convs" on public.conversation_participants;
create policy "Participants: select in own convs"
on public.conversation_participants
for select
using ( public.has_conversation_access(conversation_id) );

drop policy if exists "Participants: insert by creator or participant" on public.conversation_participants;
create policy "Participants: insert by creator or participant"
on public.conversation_participants
for insert
with check ( public.is_conversation_creator(conversation_id) or public.has_conversation_access(conversation_id) );

drop policy if exists "Participants: delete by creator or self" on public.conversation_participants;
create policy "Participants: delete by creator or self"
on public.conversation_participants
for delete
using ( public.is_conversation_creator(conversation_id) or auth.uid() = user_id );

-- RLS for messages
drop policy if exists "Messages: select in conv" on public.messages;
create policy "Messages: select in conv"
on public.messages
for select
using ( public.has_conversation_access(conversation_id) );

drop policy if exists "Messages: insert by participant" on public.messages;
create policy "Messages: insert by participant"
on public.messages
for insert
with check ( auth.uid() = sender_id and public.has_conversation_access(conversation_id) );

drop policy if exists "Messages: update own message" on public.messages;
create policy "Messages: update own message"
on public.messages
for update
using ( auth.uid() = sender_id );

drop policy if exists "Messages: delete own message" on public.messages;
create policy "Messages: delete own message"
on public.messages
for delete
using ( auth.uid() = sender_id );

-- RLS for message_receipts
drop policy if exists "Receipts: select if can access msg" on public.message_receipts;
create policy "Receipts: select if can access msg"
on public.message_receipts
for select
using ( public.can_access_message(message_id) );

drop policy if exists "Receipts: insert if can access msg" on public.message_receipts;
create policy "Receipts: insert if can access msg"
on public.message_receipts
for insert
with check ( public.can_access_message(message_id) and auth.uid() = user_id );

drop policy if exists "Receipts: update own receipt" on public.message_receipts;
create policy "Receipts: update own receipt"
on public.message_receipts
for update
using ( auth.uid() = user_id and public.can_access_message(message_id) );

-- 5) Notifications

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_created_idx on public.notifications(created_at);

drop policy if exists "Notifications: select own" on public.notifications;
create policy "Notifications: select own"
on public.notifications
for select
using ( auth.uid() = user_id );

drop policy if exists "Notifications: insert own only" on public.notifications;
create policy "Notifications: insert own only"
on public.notifications
for insert
with check ( auth.uid() = user_id );

drop policy if exists "Notifications: update own" on public.notifications;
create policy "Notifications: update own"
on public.notifications
for update
using ( auth.uid() = user_id );

-- RPC to create notifications for another user (e.g. when liking/commenting)
create or replace function public.create_notification(target_user uuid, notif_type text, notif_payload jsonb default '{}'::jsonb)
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  insert into public.notifications (user_id, type, payload)
  values (target_user, notif_type, coalesce(notif_payload, '{}'::jsonb))
  returning id;
$$;

-- 6) Search across people and companies
create or replace function public.search_people_and_companies(q text, limit_count int default 10)
returns table(
  entity_type text,
  id uuid,
  label text,
  subtitle text,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  with ppl as (
    select
      'person'::text as entity_type,
      p.id,
      coalesce(nullif(trim(p.vorname || ' ' || p.nachname), ''), p.email, 'Profil') as label,
      coalesce(p.headline, p.ausbildungsberuf, p.ort, '') as subtitle,
      p.avatar_url
    from public.profiles p
    where
      (p.profile_published = true or p.id = auth.uid())
      and (
        q is null
        or q = ''
        or (p.vorname ilike '%'||q||'%' or p.nachname ilike '%'||q||'%' or p.ausbildungsberuf ilike '%'||q||'%' or p.ort ilike '%'||q||'%' or p.email ilike '%'||q||'%')
      )
    limit coalesce(limit_count, 10)
  ),
  comps as (
    select
      'company'::text as entity_type,
      c.id,
      c.name as label,
      coalesce(c.industry, c.main_location, '') as subtitle,
      c.logo_url as avatar_url
    from public.companies c
    where
      (q is null or q = '' or c.name ilike '%'||q||'%' or c.industry ilike '%'||q||'%' or c.main_location ilike '%'||q||'%')
    limit coalesce(limit_count, 10)
  )
  select * from ppl
  union all
  select * from comps
  limit coalesce(limit_count, 10);
$$;

-- 7) Helpful indexes for feed performance
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_published_idx on public.posts(status, published_at);
create index if not exists follows_follower_following_idx on public.follows(follower_id, following_id);

