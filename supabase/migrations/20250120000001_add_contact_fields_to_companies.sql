-- Add contact_email and contact_phone columns to companies table
-- These fields store the public contact information for the company's recruiter/contact person

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN companies.contact_email IS 'Public email address for the company contact person (visible to candidates)';
COMMENT ON COLUMN companies.contact_phone IS 'Public phone number for the company contact person (visible to candidates)';

