-- Ensure public bucket for post uploads exists
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Conditionally create policies for post-media bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Public read post-media'
  ) THEN
    CREATE POLICY "Public read post-media" ON storage.objects
    FOR SELECT USING (bucket_id = 'post-media');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Users can upload their own post-media'
  ) THEN
    CREATE POLICY "Users can upload their own post-media" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Users can update their own post-media'
  ) THEN
    CREATE POLICY "Users can update their own post-media" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Users can delete their own post-media'
  ) THEN
    CREATE POLICY "Users can delete their own post-media" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;