-- Allow checking email/phone uniqueness BEFORE signup (no auth session yet).
-- Returns only booleans (does not reveal any user data).

create or replace function public.check_profile_uniqueness_public(
  p_email text,
  p_phone text
)
returns table(email_exists boolean, phone_exists boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
begin
  select exists(
    select 1 from public.profiles p
    where v_email is not null
      and lower(p.email) = v_email
  )
  into email_exists;

  select exists(
    select 1 from public.profiles p
    where v_phone is not null
      and trim(p.telefon) = v_phone
  )
  into phone_exists;

  return;
end;
$$;

revoke all on function public.check_profile_uniqueness_public(text, text) from public;
grant execute on function public.check_profile_uniqueness_public(text, text) to anon, authenticated;


