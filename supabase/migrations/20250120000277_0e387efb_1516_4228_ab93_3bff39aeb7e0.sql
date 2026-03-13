-- Add certificates, licenses, qualifications and document requirements to job_posts
ALTER TABLE public.job_posts
ADD COLUMN IF NOT EXISTS required_certificates TEXT[], -- Benötigte Zertifikate
ADD COLUMN IF NOT EXISTS required_licenses TEXT[], -- Benötigte Führerscheine
ADD COLUMN IF NOT EXISTS required_qualifications TEXT[], -- Benötigte Qualifikationen
ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb, -- Must-have Dokumente für Bewerbung
ADD COLUMN IF NOT EXISTS optional_documents JSONB DEFAULT '[]'::jsonb; -- Nice-to-have Dokumente

-- Comment explaining the structure of document fields
COMMENT ON COLUMN public.job_posts.required_documents IS 'Array of required document types for application. Format: [{"type": "cv", "label": "Lebenslauf"}, {"type": "certificate", "label": "Abschlusszeugnis"}]';
COMMENT ON COLUMN public.job_posts.optional_documents IS 'Array of optional document types for application. Format: [{"type": "portfolio", "label": "Portfolio"}, {"type": "reference", "label": "Referenzen"}]';