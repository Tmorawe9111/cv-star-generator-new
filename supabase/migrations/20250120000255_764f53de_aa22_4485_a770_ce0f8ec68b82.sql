-- Erstelle Admin-User "Admin@BeVisiblle.de" mit Passwort "James007.?"
-- Hinweis: Dieser Account wird direkt in auth.users angelegt

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Prüfe ob User bereits existiert
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Admin@BeVisiblle.de') THEN
    -- Erstelle User mit bestätigter Email
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'Admin@BeVisiblle.de',
      crypt('James007.?', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"created_by":"migration"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    -- Füge Admin-Rolle hinzu
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin-Account erstellt: Admin@BeVisiblle.de (ID: %)', new_user_id;
  ELSE
    RAISE NOTICE 'Admin-Account Admin@BeVisiblle.de existiert bereits';
  END IF;
END $$;