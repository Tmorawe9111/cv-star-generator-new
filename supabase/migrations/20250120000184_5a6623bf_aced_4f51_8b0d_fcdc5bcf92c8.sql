-- 1) Add social link columns on companies
alter table public.companies
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

-- 2) Public read access for companies (marketplace public profile)
create policy if not exists "Public can view companies (marketplace)"
  on public.companies
  for select
  using (true);

-- 3) Storage bucket for company media (logos, banners)
insert into storage.buckets (id, name, public)
values ('company-media', 'company-media', true)
on conflict (id) do nothing;

-- Storage policies for company-media bucket
create policy if not exists "Public read company-media"
on storage.objects
for select
to public
using (bucket_id = 'company-media');

create policy if not exists "Authenticated upload company-media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'company-media');

create policy if not exists "Owners manage company-media"
on storage.objects
for all
to authenticated
using (bucket_id = 'company-media' and owner = auth.uid())
with check (bucket_id = 'company-media' and owner = auth.uid());