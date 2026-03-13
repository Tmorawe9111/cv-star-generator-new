-- Add OAuth credentials to company_calendar_integrations
-- Each company can configure their own OAuth credentials

ALTER TABLE public.company_calendar_integrations 
ADD COLUMN IF NOT EXISTS oauth_client_id text,
ADD COLUMN IF NOT EXISTS oauth_client_secret text,
ADD COLUMN IF NOT EXISTS oauth_redirect_uri text;

-- Add comment
COMMENT ON COLUMN public.company_calendar_integrations.oauth_client_id IS 'Company-specific OAuth Client ID (encrypted in production)';
COMMENT ON COLUMN public.company_calendar_integrations.oauth_client_secret IS 'Company-specific OAuth Client Secret (encrypted in production)';
COMMENT ON COLUMN public.company_calendar_integrations.oauth_redirect_uri IS 'Company-specific OAuth Redirect URI';

