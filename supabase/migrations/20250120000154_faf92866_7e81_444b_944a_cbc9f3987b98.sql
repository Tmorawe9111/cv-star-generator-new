
-- 1) Trigger-Funktion: Subscription → Companies spiegeln
create or replace function public.sync_company_from_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.companies c
     set active_tokens = new.token_balance,
         seats = new.seats,
         plan_type = new.plan_id,
         subscription_status = new.status,
         updated_at = now()
   where c.id = new.company_id;
  return new;
end;
$$;

-- 2) Trigger anlegen (bei Insert/Update auf relevante Spalten)
drop trigger if exists tr_sync_company_from_subscription on public.company_subscriptions;

create trigger tr_sync_company_from_subscription
after insert or update of token_balance, seats, plan_id, status
on public.company_subscriptions
for each row
execute procedure public.sync_company_from_subscription();

-- 3) Einmaliges Backfill der aktuellen Werte
update public.companies c
set active_tokens = s.token_balance,
    seats = s.seats,
    plan_type = s.plan_id,
    subscription_status = s.status,
    updated_at = now()
from public.company_subscriptions s
where s.company_id = c.id;

-- 4) Realtime aktivieren (vollständige Row-Daten + in Publikation aufnehmen)
alter table public.companies replica identity full;
alter table public.company_subscriptions replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'companies'
  ) then
    execute 'alter publication supabase_realtime add table public.companies';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'company_subscriptions'
  ) then
    execute 'alter publication supabase_realtime add table public.company_subscriptions';
  end if;
end $$;
