-- Relax PLZ length to avoid insert failures caused by longer inputs
-- Root-cause logs: "value too long for type character varying(5)"
-- Change varchar(5) -> varchar(16) to be permissive while still bounded
ALTER TABLE public.profiles
  ALTER COLUMN plz TYPE varchar(16);