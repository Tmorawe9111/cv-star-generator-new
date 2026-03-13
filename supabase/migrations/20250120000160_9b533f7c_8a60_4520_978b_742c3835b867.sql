-- Promote specified user to admin if account exists
insert into public.user_types (user_id, user_type)
select u.id, 'admin'
from auth.users u
where lower(u.email) = lower('todd@Ausbildungsbasis.com')
  and not exists (
    select 1 from public.user_types ut
    where ut.user_id = u.id and ut.user_type = 'admin'
  );