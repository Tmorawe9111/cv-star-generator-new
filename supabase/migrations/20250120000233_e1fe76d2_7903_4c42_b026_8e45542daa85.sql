-- Set some companies to have employer_profile = true for testing
UPDATE companies 
SET employer_profile = true 
WHERE id IN (
  SELECT id 
  FROM companies 
  WHERE name IS NOT NULL 
  AND name != '' 
  LIMIT 10
);