-- Fix handle_new_user trigger to use correct column names (vorname/nachname instead of first_name/last_name)
-- This ensures profiles are created correctly with names

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain text;
  v_is_company boolean;
  v_private_domains text[] := ARRAY[
    'gmail.com','googlemail.com',
    'outlook.com','outlook.de','hotmail.com','hotmail.de','live.com','live.de','msn.com',
    'yahoo.com','yahoo.de',
    'icloud.com','me.com','mac.com',
    'proton.me','protonmail.com','pm.me',
    'aol.com','aol.de',
    'gmx.de','gmx.net','web.de','mail.de','t-online.de','freenet.de','posteo.de','mailbox.org',
    'arcor.de','online.de','1und1.de','ionos.de','vodafone.de','unitybox.de','kabelmail.de','telekom.de',
    'bluewin.ch','gmx.ch','gmx.at','aon.at'
  ];
BEGIN
  v_is_company := COALESCE((NEW.raw_user_meta_data->>'is_company')::boolean, false);

  -- Never auto-create profiles for company users
  IF v_is_company THEN
    RETURN NEW;
  END IF;

  -- Extract email domain
  v_domain := lower(split_part(NEW.email, '@', 2));

  -- Only auto-create profiles for allowed private domains
  IF v_domain IS NULL OR v_domain = '' OR NOT (v_domain = ANY(v_private_domains)) THEN
    RETURN NEW;
  END IF;

  -- Only create profile if it doesn't already exist (to avoid conflicts with QuickSignup)
  -- QuickSignup creates the profile with all the data, so we should not overwrite it
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id,
      vorname,
      nachname,
      email,
      account_created,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'vorname', NEW.raw_user_meta_data->>'first_name', NULL),
      COALESCE(NEW.raw_user_meta_data->>'nachname', NEW.raw_user_meta_data->>'last_name', NULL),
      NEW.email,
      true,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

