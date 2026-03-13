-- Fix employment_type check constraint
-- The constraint currently only allows: 'full-time', 'part-time', 'contract', 'internship'
-- But the application also uses 'apprenticeship' for apprenticeship positions

-- STEP 1: First, update existing data to match the new constraint values
-- Fix common variations that don't match the constraint (including German values)
UPDATE public.job_posts
SET employment_type = CASE
  -- English variations
  WHEN employment_type = 'fulltime' THEN 'full-time'
  WHEN employment_type = 'parttime' THEN 'part-time'
  WHEN employment_type = 'temporary' THEN 'contract'
  WHEN employment_type = 'temp' THEN 'contract'
  WHEN employment_type = 'freelance' THEN 'contract'
  WHEN employment_type = 'freelancer' THEN 'contract'
  -- German values
  WHEN LOWER(employment_type) = 'vollzeit' THEN 'full-time'
  WHEN LOWER(employment_type) = 'teilzeit' THEN 'part-time'
  WHEN LOWER(employment_type) = 'ausbildung' THEN 'apprenticeship'
  WHEN LOWER(employment_type) = 'praktikum' THEN 'internship'
  WHEN LOWER(employment_type) = 'zeitarbeit' THEN 'contract'
  WHEN LOWER(employment_type) = 'befristet' THEN 'contract'
  -- Default fallback for unknown values
  WHEN employment_type NOT IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship') 
    AND employment_type IS NOT NULL 
    THEN 'full-time'
  ELSE employment_type
END
WHERE employment_type IS NOT NULL
  AND employment_type NOT IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship');

-- Also update job_postings table if it exists (old table name)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') THEN
    UPDATE public.job_postings
    SET employment_type = CASE
      -- English variations
      WHEN employment_type = 'fulltime' THEN 'full-time'
      WHEN employment_type = 'parttime' THEN 'part-time'
      WHEN employment_type = 'temporary' THEN 'contract'
      WHEN employment_type = 'temp' THEN 'contract'
      WHEN employment_type = 'freelance' THEN 'contract'
      WHEN employment_type = 'freelancer' THEN 'contract'
      -- German values
      WHEN LOWER(employment_type) = 'vollzeit' THEN 'full-time'
      WHEN LOWER(employment_type) = 'teilzeit' THEN 'part-time'
      WHEN LOWER(employment_type) = 'ausbildung' THEN 'apprenticeship'
      WHEN LOWER(employment_type) = 'praktikum' THEN 'internship'
      WHEN LOWER(employment_type) = 'zeitarbeit' THEN 'contract'
      WHEN LOWER(employment_type) = 'befristet' THEN 'contract'
      -- Default fallback for unknown values
      WHEN employment_type NOT IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship') 
        AND employment_type IS NOT NULL 
        THEN 'full-time'
      ELSE employment_type
    END
    WHERE employment_type IS NOT NULL
      AND employment_type NOT IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship');
  END IF;
END $$;

-- STEP 2: Drop the old constraint
DO $$ 
BEGIN
  -- Drop constraint if it exists (check by name)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'job_posts_employment_type_check' 
    AND conrelid = 'public.job_posts'::regclass
  ) THEN
    ALTER TABLE public.job_posts DROP CONSTRAINT job_posts_employment_type_check;
  END IF;
END $$;

-- STEP 3: Create a function to normalize employment_type before insert/update
CREATE OR REPLACE FUNCTION normalize_employment_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize employment_type to valid values
  IF NEW.employment_type IS NOT NULL THEN
    NEW.employment_type := CASE
      -- English variations
      WHEN LOWER(NEW.employment_type) = 'fulltime' THEN 'full-time'
      WHEN LOWER(NEW.employment_type) = 'parttime' THEN 'part-time'
      WHEN LOWER(NEW.employment_type) = 'temporary' THEN 'contract'
      WHEN LOWER(NEW.employment_type) = 'temp' THEN 'contract'
      WHEN LOWER(NEW.employment_type) = 'freelance' THEN 'contract'
      WHEN LOWER(NEW.employment_type) = 'freelancer' THEN 'contract'
      -- German values
      WHEN LOWER(NEW.employment_type) = 'vollzeit' THEN 'full-time'
      WHEN LOWER(NEW.employment_type) = 'teilzeit' THEN 'part-time'
      WHEN LOWER(NEW.employment_type) = 'ausbildung' THEN 'apprenticeship'
      WHEN LOWER(NEW.employment_type) = 'praktikum' THEN 'internship'
      WHEN LOWER(NEW.employment_type) = 'zeitarbeit' THEN 'contract'
      WHEN LOWER(NEW.employment_type) = 'befristet' THEN 'contract'
      -- Keep valid values as-is
      WHEN NEW.employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship') THEN NEW.employment_type
      -- Default fallback for unknown values
      ELSE 'full-time'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create trigger to normalize employment_type before insert/update
DROP TRIGGER IF EXISTS trg_normalize_employment_type ON public.job_posts;
CREATE TRIGGER trg_normalize_employment_type
  BEFORE INSERT OR UPDATE ON public.job_posts
  FOR EACH ROW
  WHEN (NEW.employment_type IS NOT NULL)
  EXECUTE FUNCTION normalize_employment_type();

-- STEP 5: Add new constraint with 'apprenticeship' included
ALTER TABLE public.job_posts
ADD CONSTRAINT job_posts_employment_type_check 
CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship') OR employment_type IS NULL);

-- Also fix job_postings table if it exists (old table name)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'job_postings_employment_type_check' 
      AND conrelid = 'public.job_postings'::regclass
    ) THEN
      ALTER TABLE public.job_postings DROP CONSTRAINT job_postings_employment_type_check;
    END IF;
    
    ALTER TABLE public.job_postings
    ADD CONSTRAINT job_postings_employment_type_check 
    CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'apprenticeship') OR employment_type IS NULL);
  END IF;
END $$;

