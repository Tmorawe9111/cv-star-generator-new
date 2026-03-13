-- Check if tables already exist and drop them if needed
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS company_follow_prefs CASCADE;
DROP TABLE IF EXISTS follow_request_counters CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS follow_entity CASCADE;
DROP TYPE IF EXISTS follow_status CASCADE;