-- Add missing fields to profiles table for enhanced CV integration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_drivers_license BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_own_vehicle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_year TEXT,
ADD COLUMN IF NOT EXISTS visibility_industry JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS visibility_region JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create storage bucket for CVs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile images if it doesn't exist  
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for CV uploads
CREATE POLICY "Users can upload their own CVs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CVs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CVs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for profile images
CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_published ON public.profiles(profile_published);
CREATE INDEX IF NOT EXISTS idx_profiles_branche ON public.profiles(branche);
CREATE INDEX IF NOT EXISTS idx_profiles_ort ON public.profiles(ort);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);