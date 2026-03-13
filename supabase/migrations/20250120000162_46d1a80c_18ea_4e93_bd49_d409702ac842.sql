-- Create roles enum and table for content admin/editor
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Basic RLS: users can read their own roles
DO $$ BEGIN
  CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update checker to use user_roles (fallback kept for compatibility)
CREATE OR REPLACE FUNCTION public.is_content_editor(_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = coalesce(_uid, auth.uid())
      and ur.role in ('admin','editor')
  );
$$;

-- Promote todd to admin in user_roles
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = lower('todd@Ausbildungsbasis.com')
  and not exists (
    select 1 from public.user_roles ur
    where ur.user_id = u.id and ur.role = 'admin'
  );