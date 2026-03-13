-- 1) Add social link columns on companies
alter table public.companies
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

-- 2) Public read access for companies (marketplace public profile)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Public can view companies (marketplace)'
  ) THEN
    EXECUTE 'create policy "Public can view companies (marketplace)" on public.companies for select using (true)';
  END IF;
END $$;

-- 3) Storage bucket for company media (logos, banners)
insert into storage.buckets (id, name, public)
values ('company-media', 'company-media', true)
on conflict (id) do nothing;

-- Storage policies for company-media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read company-media'
  ) THEN
    EXECUTE 'create policy "Public read company-media" on storage.objects for select to public using (bucket_id = ''company-media'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload company-media'
  ) THEN
    EXECUTE 'create policy "Authenticated upload company-media" on storage.objects for insert to authenticated with check (bucket_id = ''company-media'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Owners manage company-media'
  ) THEN
    EXECUTE 'create policy "Owners manage company-media" on storage.objects for all to authenticated using (bucket_id = ''company-media'' and owner = auth.uid()) with check (bucket_id = ''company-media'' and owner = auth.uid())';
  END IF;
END $$;