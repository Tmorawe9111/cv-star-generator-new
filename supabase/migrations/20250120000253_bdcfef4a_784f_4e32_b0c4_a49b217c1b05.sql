-- Create index on postal_codes.plz for faster prefix searches
CREATE INDEX IF NOT EXISTS idx_postal_codes_plz ON public.postal_codes(plz);
