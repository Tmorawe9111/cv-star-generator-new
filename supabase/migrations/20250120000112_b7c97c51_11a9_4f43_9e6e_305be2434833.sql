-- Fix Critical Security Issues

-- 1. Enable RLS on public tables that don't have it
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 2. Create secure read-only policies for reference tables
CREATE POLICY "Public read access for states" 
ON public.states 
FOR SELECT 
USING (true);

CREATE POLICY "Public read access for schools" 
ON public.schools 
FOR SELECT 
USING (true);

-- 3. Fix dangerous applications table policies - remove overly permissive policies
DROP POLICY IF EXISTS "Allow public insert" ON public.applications;
DROP POLICY IF EXISTS "Allow public read access" ON public.applications;
DROP POLICY IF EXISTS "Allow public update" ON public.applications;

-- 4. Create secure policies for applications table
CREATE POLICY "Users can view their own applications" 
ON public.applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
ON public.applications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Fix function security - add search_path to existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into user_activity
  INSERT INTO public.user_activity (id)
  VALUES (NEW.id);
  
  -- Insert into profiles with default values
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'username', SUBSTRING(NEW.email FROM 1 FOR POSITION('@' IN NEW.email) - 1))
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    DELETE FROM public.sessions WHERE expires_at < NOW();
END;
$function$;

-- 6. Add user_id constraint to applications table to ensure it's always set
ALTER TABLE public.applications ALTER COLUMN user_id SET NOT NULL;