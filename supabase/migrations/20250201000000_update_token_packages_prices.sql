-- Update token packages with correct prices
-- 50 Tokens = 980€ (98,000 cents)
-- 150 Tokens = 2,600€ (260,000 cents)
-- 300 Tokens = 5,000€ (500,000 cents)

-- First, deactivate old packages
UPDATE public.token_packages 
SET active = false 
WHERE active = true;

-- Insert new token packages with correct prices
INSERT INTO public.token_packages (credits, price_cents, active) VALUES
(50, 98000, true),
(150, 260000, true),
(300, 500000, true);

