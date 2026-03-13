-- Phase 1B: Job Management - RPC Functions (Fixed)

-- 1. Missing required documents RPC (simplified - checks only if document exists)
CREATE OR REPLACE FUNCTION missing_required_documents(p_user uuid, p_job uuid)
RETURNS text[] 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_docs text[];
  have_docs text[];
  missing_docs text[];
BEGIN
  -- Get required documents
  SELECT documents_required INTO required_docs
  FROM job_posts WHERE id = p_job;
  
  IF required_docs IS NULL OR array_length(required_docs, 1) IS NULL THEN
    RETURN '{}';
  END IF;
  
  -- Get available documents
  SELECT array_agg(DISTINCT document_type) INTO have_docs
  FROM user_documents 
  WHERE user_id = p_user;
  
  -- Find missing
  SELECT array_agg(dt) INTO missing_docs
  FROM unnest(required_docs) AS dt
  WHERE NOT (dt = ANY(COALESCE(have_docs, '{}')));
  
  RETURN COALESCE(missing_docs, '{}');
END;
$$;

-- 2. Compute match RPC
CREATE OR REPLACE FUNCTION compute_match(p_user uuid, p_job uuid)
RETURNS integer 
LANGUAGE plpgsql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  score integer := 50;
  user_exp integer;
  job_location text;
  user_location text;
BEGIN
  SELECT COALESCE(experience_years, 0) INTO user_exp
  FROM profiles WHERE id = p_user;
  
  SELECT city INTO job_location FROM job_posts WHERE id = p_job;
  SELECT ort INTO user_location FROM profiles WHERE id = p_user;
  
  IF user_location = job_location THEN
    score := score + 20;
  END IF;
  
  IF user_exp >= 2 THEN
    score := score + 15;
  END IF;
  
  IF score > 100 THEN
    score := 100;
  END IF;
  
  RETURN score;
END;
$$;

-- 3. Publish job RPC (Token-gated)
CREATE OR REPLACE FUNCTION publish_job(job_uuid uuid, actor uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal int;
  comp_id uuid;
  old_status job_status;
BEGIN
  SELECT company_id, status INTO comp_id, old_status 
  FROM job_posts WHERE id = job_uuid FOR UPDATE;
  
  IF comp_id IS NULL THEN 
    RAISE EXCEPTION 'Job nicht gefunden.'; 
  END IF;
  
  SELECT token_balance INTO bal FROM companies WHERE id = comp_id FOR UPDATE;
  
  IF bal IS NULL THEN 
    RAISE EXCEPTION 'Firma nicht gefunden.'; 
  END IF;
  
  IF bal < 1 THEN 
    RAISE EXCEPTION 'Nicht genug Tokens zum Aktivieren der Stellenanzeige.'; 
  END IF;
  
  UPDATE job_posts 
  SET status='published', 
      is_active=true,
      published_at=COALESCE(published_at, now()), 
      updated_at=now() 
  WHERE id=job_uuid;
  
  UPDATE companies 
  SET token_balance = token_balance - 1 
  WHERE id=comp_id;
  
  INSERT INTO token_ledger(company_id, job_id, delta, reason) 
  VALUES (comp_id, job_uuid, -1, 'job_publish');
  
  INSERT INTO job_status_history(job_id, from_status, to_status, changed_by) 
  VALUES (job_uuid, old_status, 'published', actor);
END;
$$;

-- 4. Pause job RPC
CREATE OR REPLACE FUNCTION pause_job(job_uuid uuid, actor uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_status job_status;
BEGIN
  SELECT status INTO old_status FROM job_posts WHERE id = job_uuid FOR UPDATE;
  
  IF old_status IS NULL THEN 
    RAISE EXCEPTION 'Job nicht gefunden.'; 
  END IF;
  
  UPDATE job_posts 
  SET status='paused', 
      is_active=false,
      updated_at=now() 
  WHERE id=job_uuid;
  
  INSERT INTO job_status_history(job_id, from_status, to_status, changed_by) 
  VALUES (job_uuid, old_status, 'paused', actor);
END;
$$;

-- 5. Resume job RPC (no token cost)
CREATE OR REPLACE FUNCTION resume_job(job_uuid uuid, actor uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_status job_status;
BEGIN
  SELECT status INTO old_status FROM job_posts WHERE id = job_uuid FOR UPDATE;
  
  IF old_status IS NULL THEN 
    RAISE EXCEPTION 'Job nicht gefunden.'; 
  END IF;
  
  IF old_status != 'paused' THEN 
    RAISE EXCEPTION 'Nur pausierte Jobs können wieder aktiviert werden.'; 
  END IF;
  
  UPDATE job_posts 
  SET status='published', 
      is_active=true,
      updated_at=now() 
  WHERE id=job_uuid;
  
  INSERT INTO job_status_history(job_id, from_status, to_status, changed_by) 
  VALUES (job_uuid, old_status, 'published', actor);
END;
$$;

-- 6. Inactivate job RPC
CREATE OR REPLACE FUNCTION inactivate_job(job_uuid uuid, actor uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_status job_status;
BEGIN
  SELECT status INTO old_status FROM job_posts WHERE id = job_uuid FOR UPDATE;
  
  IF old_status IS NULL THEN 
    RAISE EXCEPTION 'Job nicht gefunden.'; 
  END IF;
  
  UPDATE job_posts 
  SET status='inactive', 
      is_active=false,
      updated_at=now() 
  WHERE id=job_uuid;
  
  INSERT INTO job_status_history(job_id, from_status, to_status, changed_by) 
  VALUES (job_uuid, old_status, 'inactive', actor);
END;
$$;