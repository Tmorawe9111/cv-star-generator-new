
-- Fix token_transactions foreign key constraint issue
-- The profile_id in token_transactions is used for tracking/auditing purposes
-- and should not enforce referential integrity to the profiles table

-- Drop the foreign key constraint on profile_id
ALTER TABLE public.token_transactions 
DROP CONSTRAINT IF EXISTS token_transactions_profile_id_fkey;

-- Add a comment to document why this column is not constrained
COMMENT ON COLUMN public.token_transactions.profile_id IS 
  'Optional UUID for tracking which profile triggered the transaction. Not enforced by FK constraint as it may reference profiles that no longer exist or are from external systems.';
