-- Add employee_count column to companies table if it doesn't exist
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS employee_count integer;