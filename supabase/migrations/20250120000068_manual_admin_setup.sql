-- =====================================================
-- MANUELLE ADMIN-ROLLE ZUWEISEN
-- Führe dies im Supabase SQL Editor aus
-- =====================================================

-- Schritt 1: Ersetze 'deine-email@example.com' mit deiner tatsächlichen E-Mail
-- Schritt 2: Führe das SQL aus

-- Prüfe, ob dein User existiert
SELECT id, email FROM auth.users WHERE email = 'deine-email@example.com';

-- Weise Admin-Rolle zu (wenn User existiert)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('deine-email@example.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'admin'
  );

-- Prüfe, ob es funktioniert hat
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE lower(u.email) = lower('deine-email@example.com');

-- =====================================================
-- ALTERNATIVE: Erstelle neuen User und weise Admin-Rolle zu
-- =====================================================

-- 1. Erstelle User in Supabase Dashboard: Authentication > Users > Add User
-- 2. Dann führe das INSERT oben aus (mit der neuen E-Mail)

