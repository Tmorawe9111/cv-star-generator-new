-- Add missing notes column to company_candidates table
ALTER TABLE public.company_candidates 
ADD COLUMN IF NOT EXISTS notes text;