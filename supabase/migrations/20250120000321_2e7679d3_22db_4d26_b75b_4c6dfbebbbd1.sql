-- Migration 1: Enums + Transitions + Trigger
-- Erstelle Status-, Source- und Plan-Enums sowie Validierungs-Trigger

-- 1. Enums erstellen
CREATE TYPE application_status AS ENUM (
  'new', 'unlocked', 'interview', 'offer', 'hired', 'rejected', 'archived'
);

CREATE TYPE application_source AS ENUM ('applied', 'sourced');

CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'growth', 'enterprise');

-- 2. Transitions-Tabelle (erlaubte Status-Übergänge)
CREATE TABLE IF NOT EXISTS public.application_transitions (
  from_status application_status,
  to_status application_status,
  PRIMARY KEY (from_status, to_status)
);

INSERT INTO public.application_transitions (from_status, to_status) VALUES
  ('new','unlocked'), ('new','interview'), ('new','rejected'), ('new','archived'),
  ('unlocked','interview'), ('unlocked','rejected'), ('unlocked','archived'),
  ('interview','offer'), ('interview','rejected'), ('interview','archived'),
  ('offer','hired'), ('offer','rejected'), ('offer','archived')
ON CONFLICT DO NOTHING;

-- 3. Generische updated_at Funktion
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

-- 4. Guard-Trigger für applications (wird später auf applications montiert)
CREATE OR REPLACE FUNCTION public.tg_applications_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_allowed bool;
BEGIN
  new.updated_at := now();

  IF tg_op = 'INSERT' THEN
    IF new.source = 'applied' AND new.status IS DISTINCT FROM 'new' THEN
      RAISE EXCEPTION 'APPLIED_MUST_START_NEW';
    END IF;
    IF new.source = 'sourced' AND new.status IS DISTINCT FROM 'unlocked' THEN
      RAISE EXCEPTION 'SOURCED_MUST_START_UNLOCKED';
    END IF;
    IF new.status = 'unlocked' AND new.unlocked_at IS NULL THEN
      new.unlocked_at := now();
    END IF;
    RETURN new;
  END IF;

  IF old.status = 'hired' THEN
    RAISE EXCEPTION 'FINAL_STATE_HIRED';
  END IF;

  IF new.status <> old.status THEN
    SELECT EXISTS(
      SELECT 1 FROM public.application_transitions
      WHERE from_status = old.status AND to_status = new.status
    ) INTO v_allowed;

    IF NOT v_allowed THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', old.status, new.status;
    END IF;

    new.is_new := false;

    IF new.status = 'unlocked' AND old.status <> 'unlocked' AND new.unlocked_at IS NULL THEN
      new.unlocked_at := now();
    END IF;

    IF new.status = 'rejected' THEN
      IF old.source = 'applied' AND (new.reason_short IS NULL OR LENGTH(TRIM(new.reason_short)) = 0) THEN
        RAISE EXCEPTION 'REASON_REQUIRED_FOR_APPLIED_REJECTION';
      END IF;
    ELSE
      new.reason_short := NULL;
      new.reason_custom := NULL;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- Hinweis: Trigger wird in Migration 2 montiert (nach Umbau der applications Tabelle)