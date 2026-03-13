-- Create content tables and policies for Admin Blog & Page Builder

-- 1) Helper function to check admin/editor role
create or replace function public.is_content_editor(_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_types ut
    where ut.user_id = coalesce(_uid, auth.uid())
      and ut.user_type in ('admin', 'editor')
  );
$$;

-- 2) Pages table
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_html text,
  content_markdown text,
  featured_image_url text,
  meta_title text not null,
  meta_description text not null,
  keywords text[],
  category text,
  tags text[],
  page_type text not null default 'blog',
  status text not null default 'draft', -- draft | published | archived
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid not null
);

alter table public.pages enable row level security;

-- Update timestamp trigger function (idempotent)
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach trigger
create trigger trg_pages_updated_at
before update on public.pages
for each row execute function public.update_updated_at();

-- Log revisions trigger function
create or replace function public.log_page_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.page_revisions(page_id, content_html, content_markdown, changed_by)
  values (new.id, new.content_html, new.content_markdown, coalesce(auth.uid(), new.author_id));
  return new;
end;
$$;

-- 3) Revisions table
create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  content_html text,
  content_markdown text,
  changed_at timestamptz not null default now(),
  changed_by uuid not null
);

alter table public.page_revisions enable row level security;

-- Attach trigger after insert/update on pages to log revisions
create trigger trg_pages_log_revision
after insert or update on public.pages
for each row execute function public.log_page_revision();

-- 4) Page views (simple)
create table if not exists public.page_views (
  id bigserial primary key,
  page_id uuid not null references public.pages(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text,
  ip_hash text
);

alter table public.page_views enable row level security;

-- 5) RLS Policies
-- Pages
create policy if not exists "Public can view published pages"
  on public.pages for select
  using (status = 'published' and (publish_at is null or publish_at <= now()));

create policy if not exists "Editors can view all pages"
  on public.pages for select to authenticated
  using (public.is_content_editor(auth.uid()));

create policy if not exists "Editors can insert pages"
  on public.pages for insert to authenticated
  with check (public.is_content_editor(auth.uid()) and author_id = auth.uid());

create policy if not exists "Editors can update pages"
  on public.pages for update to authenticated
  using (public.is_content_editor(auth.uid()));

create policy if not exists "Editors can delete pages"
  on public.pages for delete to authenticated
  using (public.is_content_editor(auth.uid()));

-- Page revisions (only editors can see; inserts happen via trigger)
create policy if not exists "Editors can read revisions"
  on public.page_revisions for select to authenticated
  using (public.is_content_editor(auth.uid()));

-- Page views: anyone can insert, editors can read
create policy if not exists "Anyone can insert page views"
  on public.page_views for insert
  with check (true);

create policy if not exists "Editors can read page views"
  on public.page_views for select to authenticated
  using (public.is_content_editor(auth.uid()));

-- 6) Storage bucket for blog images
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Storage policies for blog images
create policy if not exists "Public can read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

create policy if not exists "Editors can manage blog images"
  on storage.objects for all to authenticated
  using (bucket_id = 'blog-images' and public.is_content_editor(auth.uid()))
  with check (bucket_id = 'blog-images' and public.is_content_editor(auth.uid()));