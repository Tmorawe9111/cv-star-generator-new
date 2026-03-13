-- Create ENUMS first
DO $$ BEGIN
    CREATE TYPE follow_entity AS ENUM ('profile','company');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE follow_status AS ENUM ('pending','accepted','rejected','blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_type follow_entity NOT NULL,
  follower_id uuid NOT NULL,
  followee_type follow_entity NOT NULL,
  followee_id uuid NOT NULL,
  status follow_status NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_type, follower_id, followee_type, followee_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_type, follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_type, followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);

-- Create company_follow_prefs table  
CREATE TABLE IF NOT EXISTS company_follow_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bell text NOT NULL DEFAULT 'highlights',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, company_id)
);

-- Create follow_request_counters table
CREATE TABLE IF NOT EXISTS follow_request_counters (
  company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);