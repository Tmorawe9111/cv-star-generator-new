-- Add column to track used tokens
ALTER TABLE company_token_wallets 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;

-- Create view to calculate token statistics
CREATE OR REPLACE VIEW company_token_stats AS
SELECT 
  w.company_id,
  w.balance as available_tokens,
  w.tokens_used,
  (w.balance + w.tokens_used) as total_received
FROM company_token_wallets w;

-- Grant access to the view
GRANT SELECT ON company_token_stats TO authenticated;