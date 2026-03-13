-- RLS Policies für candidates Tabelle

-- Policy: Benutzer können ihre eigenen Kandidateneinträge erstellen (beim Bewerben)
CREATE POLICY "Users can create their own candidate entries"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Kandidateneinträge sehen
CREATE POLICY "Users can view their own candidate entries"
ON public.candidates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Unternehmensmitglieder können Kandidaten ihrer Firma sehen
CREATE POLICY "Company members can view their candidates"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Unternehmensmitglieder können Kandidaten ihrer Firma aktualisieren
CREATE POLICY "Company members can update their candidates"
ON public.candidates
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);