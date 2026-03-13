-- Add address fields to companies table for direct storage
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;

-- Add index for location searches
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);
CREATE INDEX IF NOT EXISTS idx_companies_postal_code ON public.companies(postal_code);

