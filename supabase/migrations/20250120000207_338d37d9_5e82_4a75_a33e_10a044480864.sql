-- Create the ENUM types
CREATE TYPE follow_entity AS ENUM ('profile', 'company');
CREATE TYPE follow_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');

-- Create the follows table
CREATE TABLE follows (
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

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON follows(follower_type, follower_id);
CREATE INDEX idx_follows_followee ON follows(followee_type, followee_id);
CREATE INDEX idx_follows_status ON follows(status);

-- Create company_follow_prefs table for notification preferences
CREATE TABLE company_follow_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bell text NOT NULL DEFAULT 'highlights' CHECK (bell IN ('off', 'highlights', 'all')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, company_id)
);

-- Create follow_request_counters for rate limiting
CREATE TABLE follow_request_counters (
  company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create update trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER trg_follows_updated_at
  BEFORE UPDATE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_company_follow_prefs_updated_at
  BEFORE UPDATE ON company_follow_prefs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();