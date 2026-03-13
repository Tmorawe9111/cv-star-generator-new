-- Remove restrictive CHECK constraint from user_documents table
-- This allows more flexible document type values
ALTER TABLE public.user_documents DROP CONSTRAINT IF EXISTS user_documents_document_type_check;

-- Optional: Add a more permissive constraint if needed
-- ALTER TABLE public.user_documents 
-- ADD CONSTRAINT user_documents_document_type_not_empty 
-- CHECK (document_type IS NOT NULL AND document_type != '');
