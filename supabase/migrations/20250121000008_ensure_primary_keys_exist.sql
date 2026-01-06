-- Ensure posts and profiles tables have primary keys
-- This fixes the "table has no primary keys" error

-- Check and add primary key to posts table if missing
DO $$
BEGIN
  -- Check if posts table has a primary key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    -- Check if id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'id'
    ) THEN
      -- Add primary key constraint
      ALTER TABLE public.posts 
      ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
      
      RAISE NOTICE 'Added primary key to posts table';
    ELSE
      RAISE WARNING 'posts table exists but has no id column!';
    END IF;
  ELSE
    RAISE NOTICE 'posts table already has primary key';
  END IF;
END $$;

-- Check and add primary key to profiles table if missing
DO $$
BEGIN
  -- Check if profiles table has a primary key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    -- Check if id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'id'
    ) THEN
      -- Add primary key constraint
      ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
      
      RAISE NOTICE 'Added primary key to profiles table';
    ELSE
      RAISE WARNING 'profiles table exists but has no id column!';
    END IF;
  ELSE
    RAISE NOTICE 'profiles table already has primary key';
  END IF;
END $$;

