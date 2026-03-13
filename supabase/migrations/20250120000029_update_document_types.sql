-- Update user_documents table to support new document types
-- Drop the old CHECK constraint
ALTER TABLE public.user_documents DROP CONSTRAINT IF EXISTS user_documents_document_type_check;

-- Add new CHECK constraint with expanded document types
ALTER TABLE public.user_documents 
ADD CONSTRAINT user_documents_document_type_check 
CHECK (document_type IN (
  'arbeitszeugnisse',
  'hochschulzeugnisse', 
  'letztes_schulzeugnis',
  'zertifikate',
  'referenzen',
  'arbeitsproben',
  'portfolios',
  'sonstige',
  -- Keep old values for backward compatibility
  'zeugnis',
  'zertifikat',
  'other'
));
