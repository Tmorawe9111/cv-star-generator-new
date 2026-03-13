-- Create public post-media bucket for post uploads (images/documents)
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Public can read post-media files
create policy if not exists "Public read post-media"
on storage.objects for select
using (bucket_id = 'post-media');

-- Auth users can upload to their own folder
create policy if not exists "Users can upload their own post-media"
on storage.objects for insert
with check (
  bucket_id = 'post-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Auth users can update their own files
create policy if not exists "Users can update their own post-media"
on storage.objects for update
using (
  bucket_id = 'post-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Auth users can delete their own files
create policy if not exists "Users can delete their own post-media"
on storage.objects for delete
using (
  bucket_id = 'post-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);
