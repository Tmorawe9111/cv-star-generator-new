-- Add stripe_checkout_session_id to purchases_v2 for invoice downloads
ALTER TABLE public.purchases_v2 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_v2_stripe_session 
ON public.purchases_v2(stripe_checkout_session_id) 
WHERE stripe_checkout_session_id IS NOT NULL;

