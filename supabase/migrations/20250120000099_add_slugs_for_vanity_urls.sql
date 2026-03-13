-- Add slug/username fields for vanity URLs

-- Username for user profiles (e.g., /@maxmustermann)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Slug for companies (e.g., /firma/bevisiblle-gmbh)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- Slug for job posts (e.g., /stelle/softwareentwickler-berlin)
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_job_posts_slug ON public.job_posts(slug);

-- Function to generate URL-safe slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Convert to lowercase
  result := lower(input_text);
  -- Replace umlauts
  result := replace(result, 'ä', 'ae');
  result := replace(result, 'ö', 'oe');
  result := replace(result, 'ü', 'ue');
  result := replace(result, 'ß', 'ss');
  -- Replace spaces and special chars with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  result := trim(both '-' from result);
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-generate username from name for profiles
CREATE OR REPLACE FUNCTION auto_generate_profile_username()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if username is null
  IF NEW.username IS NULL THEN
    -- Generate base username from vorname + nachname
    base_username := generate_slug(COALESCE(NEW.vorname, '') || ' ' || COALESCE(NEW.nachname, ''));
    
    IF base_username = '' OR base_username = '-' THEN
      base_username := 'user';
    END IF;
    
    final_username := base_username;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username AND id != NEW.id) LOOP
      counter := counter + 1;
      final_username := base_username || '-' || counter;
    END LOOP;
    
    NEW.username := final_username;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate slug for companies
CREATE OR REPLACE FUNCTION auto_generate_company_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if slug is null
  IF NEW.slug IS NULL THEN
    base_slug := generate_slug(COALESCE(NEW.name, 'unternehmen'));
    
    IF base_slug = '' OR base_slug = '-' THEN
      base_slug := 'unternehmen';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate slug for job posts
CREATE OR REPLACE FUNCTION auto_generate_job_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if slug is null
  IF NEW.slug IS NULL THEN
    base_slug := generate_slug(COALESCE(NEW.title, 'stelle') || ' ' || COALESCE(NEW.location, ''));
    
    IF base_slug = '' OR base_slug = '-' THEN
      base_slug := 'stelle';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness
    WHILE EXISTS (SELECT 1 FROM job_posts WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_auto_profile_username ON profiles;
CREATE TRIGGER trg_auto_profile_username
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_profile_username();

DROP TRIGGER IF EXISTS trg_auto_company_slug ON companies;
CREATE TRIGGER trg_auto_company_slug
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_company_slug();

DROP TRIGGER IF EXISTS trg_auto_job_slug ON job_posts;
CREATE TRIGGER trg_auto_job_slug
  BEFORE INSERT OR UPDATE ON job_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_job_slug();

-- Backfill existing records
UPDATE profiles SET username = NULL WHERE username IS NULL;
UPDATE companies SET slug = NULL WHERE slug IS NULL;
UPDATE job_posts SET slug = NULL WHERE slug IS NULL;

