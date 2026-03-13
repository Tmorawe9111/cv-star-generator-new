-- Create storage buckets for post media and documents

-- Create bucket for post media (images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for post documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-documents',
  'post-documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for post-media bucket
CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- RLS policies for post-documents bucket
CREATE POLICY "Anyone can view post documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-documents');

CREATE POLICY "Authenticated users can upload post documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own post documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-documents'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own post documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-documents'
  AND auth.uid()::text = (storage.foldername(name))[2]
);