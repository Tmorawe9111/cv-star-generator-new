-- Phase 2: Company Notes Tabelle
CREATE TABLE IF NOT EXISTS public.company_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_notes ENABLE ROW LEVEL SECURITY;

-- Nur Admins können Notizen lesen/erstellen/bearbeiten
CREATE POLICY "Admins can manage company notes"
ON public.company_notes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_company_notes_company_id ON public.company_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_company_notes_created_at ON public.company_notes(created_at DESC);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_company_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_notes_timestamp
BEFORE UPDATE ON public.company_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_company_notes_updated_at();