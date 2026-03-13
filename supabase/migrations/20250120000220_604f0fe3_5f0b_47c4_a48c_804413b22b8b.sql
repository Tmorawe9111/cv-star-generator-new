-- Fix security issues for the functions we just created
ALTER FUNCTION public.compute_match_percent(uuid, jsonb, text) SET search_path = '';
ALTER FUNCTION public.profiles_with_match(uuid, text, int, int) SET search_path = '';