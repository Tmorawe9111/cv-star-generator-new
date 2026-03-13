
-- 1) Social links on companies
alter table public.companies
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

-- 2) Public read access for the marketplace (additive with existing policies)
-- This allows unauthenticated users (Azubis) to view company profiles.
create policy if not exists "Public can view companies (marketplace)"
  on public.companies
  for select
  using (true);

-- 3) Storage bucket for company media (logos, banners)
insert into storage.buckets (id, name, public)
values ('company-media', 'company-media', true)
on conflict (id) do nothing;

-- Storage RLS policies for the company-media bucket

-- Allow anyone (public) to read files in the bucket
create policy if not exists "Public read company-media"
on storage.objects
for select
to public
using (bucket_id = 'company-media');

-- Allow authenticated users to upload into the bucket
create policy if not exists "Authenticated upload company-media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'company-media');

-- Allow owners to update/delete their own uploads in the bucket
create policy if not exists "Owners manage company-media"
on storage.objects
for all
to authenticated
using (bucket_id = 'company-media' and owner = auth.uid())
with check (bucket_id = 'company-media' and owner = auth.uid());
