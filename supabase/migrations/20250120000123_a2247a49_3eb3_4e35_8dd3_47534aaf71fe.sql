-- Fix function search path security warnings
-- Update existing functions to have secure search paths

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER 
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, account_created)
  VALUES (
    NEW.id, 
    NEW.email,
    true
  );
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;