-- =====================================================
-- CLEANUP SCRIPT: Delete all Posts and Profiles
-- WARNING: This will delete ALL data from these tables!
-- =====================================================

-- Step 1: Delete all posts (this will cascade to related tables)
-- First, let's check if posts table has a primary key
DO $$
BEGIN
  -- Check if posts table exists and has primary key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE NOTICE 'Posts table has primary key, proceeding with delete...';
  ELSE
    RAISE WARNING 'Posts table may not have primary key!';
  END IF;
END $$;

-- Delete all posts
-- This will automatically delete related records in:
-- - post_likes (via foreign key CASCADE)
-- - post_comments (via foreign key CASCADE)
-- - post_reposts (via foreign key CASCADE)
DELETE FROM public.posts;

-- Step 2: Delete all profiles
-- WARNING: This will also delete related data in other tables!
-- First, let's check if profiles table has a primary key
DO $$
BEGIN
  -- Check if profiles table exists and has primary key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE NOTICE 'Profiles table has primary key, proceeding with delete...';
  ELSE
    RAISE WARNING 'Profiles table may not have primary key!';
  END IF;
END $$;

-- Delete all profiles
-- Note: This will cascade to related tables if foreign keys are set to CASCADE
-- If you get foreign key constraint errors, you may need to delete related data first
DELETE FROM public.profiles;

-- Step 3: Show summary
DO $$
DECLARE
  posts_count INTEGER;
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO posts_count FROM public.posts;
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  
  RAISE NOTICE 'Cleanup complete!';
  RAISE NOTICE 'Remaining posts: %', posts_count;
  RAISE NOTICE 'Remaining profiles: %', profiles_count;
END $$;

