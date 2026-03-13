-- ============================================================================
-- Phase 1: Critical Security Fixes
-- ============================================================================

-- 1.1: Create RPC function to get masked profile preview
CREATE OR REPLACE FUNCTION get_profile_preview(
  p_profile_id UUID,
  p_company_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  city TEXT,
  age INTEGER,
  status TEXT,
  branche TEXT,
  skills TEXT[],
  bio_preview TEXT,
  email TEXT,
  phone TEXT,
  full_address TEXT,
  birth_date DATE,
  is_unlocked BOOLEAN,
  unlocked_at TIMESTAMPTZ
) AS $$
DECLARE
  v_is_unlocked BOOLEAN;
  v_unlocked_at TIMESTAMPTZ;
BEGIN
  -- Check if profile is unlocked for this company
  SELECT 
    (cc.unlocked_at IS NOT NULL),
    cc.unlocked_at
  INTO v_is_unlocked, v_unlocked_at
  FROM company_candidates cc
  WHERE cc.company_id = p_company_id
    AND cc.candidate_id = p_profile_id;
  
  -- If not found in company_candidates, profile is not unlocked
  IF NOT FOUND THEN
    v_is_unlocked := FALSE;
    v_unlocked_at := NULL;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    CASE 
      WHEN v_is_unlocked THEN p.full_name
      ELSE SPLIT_PART(p.full_name, ' ', 1) -- Only first name
    END as name,
    p.avatar_url,
    p.role,
    p.ort as city,
    EXTRACT(YEAR FROM AGE(p.birth_date))::INTEGER as age,
    p.status,
    p.branche,
    p.skills,
    CASE 
      WHEN v_is_unlocked THEN p.bio
      ELSE LEFT(p.bio, 100) || '...' -- Truncated bio
    END as bio_preview,
    CASE 
      WHEN v_is_unlocked THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN v_is_unlocked THEN p.phone
      ELSE NULL
    END as phone,
    CASE 
      WHEN v_is_unlocked THEN p.strasse || ', ' || p.plz || ' ' || p.ort
      ELSE NULL
    END as full_address,
    CASE 
      WHEN v_is_unlocked THEN p.birth_date
      ELSE NULL
    END as birth_date,
    v_is_unlocked,
    v_unlocked_at
  FROM profiles p
  WHERE p.id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2: Enable RLS for posts table and create policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own posts
DROP POLICY IF EXISTS "users_view_own_posts" ON posts;
CREATE POLICY "users_view_own_posts" ON posts
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Companies can view posts from unlocked candidates
DROP POLICY IF EXISTS "companies_view_unlocked_posts" ON posts;
CREATE POLICY "companies_view_unlocked_posts" ON posts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM company_candidates cc
    JOIN company_users cu ON cu.company_id = cc.company_id
    WHERE cc.candidate_id = posts.user_id
    AND cu.user_id = auth.uid()
    AND cc.unlocked_at IS NOT NULL
  )
);

-- Policy: Allow users to insert their own posts
DROP POLICY IF EXISTS "users_insert_own_posts" ON posts;
CREATE POLICY "users_insert_own_posts" ON posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own posts
DROP POLICY IF EXISTS "users_update_own_posts" ON posts;
CREATE POLICY "users_update_own_posts" ON posts
FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Allow users to delete their own posts
DROP POLICY IF EXISTS "users_delete_own_posts" ON posts;
CREATE POLICY "users_delete_own_posts" ON posts
FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Phase 2: Unlock System Repair
-- ============================================================================

-- 2.1: Drop existing use_company_token function and recreate with proper signature
DROP FUNCTION IF EXISTS use_company_token(UUID, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS use_company_token(UUID, UUID);

CREATE OR REPLACE FUNCTION use_company_token(
  p_company_id UUID,
  p_profile_id UUID,
  p_token_cost INTEGER DEFAULT 1,
  p_reason TEXT DEFAULT 'unlock_basic'
) RETURNS JSON AS $$
DECLARE
  v_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_balance
  FROM company_token_wallets
  WHERE company_id = p_company_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF v_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kein Token-Wallet gefunden'
    );
  END IF;
  
  -- Check if sufficient balance
  IF v_balance < p_token_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Nicht genügend Tokens verfügbar',
      'balance', v_balance,
      'required', p_token_cost
    );
  END IF;
  
  -- Deduct tokens
  UPDATE company_token_wallets
  SET balance = balance - p_token_cost,
      updated_at = NOW()
  WHERE company_id = p_company_id;
  
  -- Log transaction
  INSERT INTO token_transactions (
    company_id, 
    delta, 
    reason, 
    profile_id,
    created_at
  )
  VALUES (
    p_company_id, 
    -p_token_cost, 
    p_reason, 
    p_profile_id,
    NOW()
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_balance - p_token_cost
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Phase 3: Matching System Implementation
-- ============================================================================

-- 3.1: Create dynamic match calculation function
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_profile_id UUID,
  p_company_id UUID,
  p_job_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_profile RECORD;
  v_company RECORD;
  v_job RECORD;
  v_skills_match INTEGER := 0;
  v_common_skills INTEGER := 0;
BEGIN
  -- Load profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  
  -- Load company
  SELECT * INTO v_company FROM companies WHERE id = p_company_id;
  
  -- If no data found, return 0
  IF v_profile IS NULL OR v_company IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Industry match (30 points)
  IF v_profile.branche = v_company.industry THEN
    v_score := v_score + 30;
  ELSIF v_profile.branche IS NOT NULL AND v_company.industry IS NOT NULL 
    AND v_profile.branche ILIKE '%' || v_company.industry || '%' THEN
    v_score := v_score + 15;
  END IF;
  
  -- Location match (25 points)
  IF v_profile.ort = v_company.location THEN
    v_score := v_score + 25;
  ELSIF v_profile.plz IS NOT NULL AND v_company.zip IS NOT NULL
    AND LEFT(v_profile.plz, 2) = LEFT(v_company.zip, 2) THEN
    v_score := v_score + 15; -- Same region
  ELSIF v_profile.plz IS NOT NULL AND v_company.zip IS NOT NULL
    AND LEFT(v_profile.plz, 1) = LEFT(v_company.zip, 1) THEN
    v_score := v_score + 8; -- Same area
  END IF;
  
  -- Skills match (20 points) - if job specified
  IF p_job_id IS NOT NULL THEN
    SELECT * INTO v_job FROM job_postings WHERE id = p_job_id;
    IF v_job IS NOT NULL AND v_profile.skills IS NOT NULL AND v_job.required_skills IS NOT NULL THEN
      -- Count common skills
      SELECT COUNT(*) INTO v_common_skills
      FROM unnest(v_profile.skills) ps
      WHERE ps = ANY(v_job.required_skills);
      
      -- Calculate percentage match
      IF array_length(v_job.required_skills, 1) > 0 THEN
        v_skills_match := LEAST(20, (v_common_skills * 20) / array_length(v_job.required_skills, 1));
        v_score := v_score + v_skills_match;
      END IF;
    END IF;
  ELSE
    -- General skills relevance (10 points if no job specified)
    IF v_profile.skills IS NOT NULL AND array_length(v_profile.skills, 1) > 0 THEN
      v_score := v_score + 10;
    END IF;
  END IF;
  
  -- Status match (15 points)
  -- Boost for students/trainees looking for opportunities
  IF v_profile.status IN ('schueler', 'azubi', 'student') THEN
    v_score := v_score + 15;
  ELSIF v_profile.status IN ('berufstatig', 'selbststandig') THEN
    v_score := v_score + 10;
  END IF;
  
  -- Activity/Availability (10 points)
  IF v_profile.job_search_preferences IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  -- Cap at 100
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_preview TO authenticated;
GRANT EXECUTE ON FUNCTION use_company_token TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_match_score TO authenticated;