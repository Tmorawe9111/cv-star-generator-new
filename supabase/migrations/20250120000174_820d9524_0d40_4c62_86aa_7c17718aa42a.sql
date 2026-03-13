-- Create rate limit table used by the edge function
create table if not exists public.rate_limit_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful index
create index if not exists idx_rlc_user_action_window
  on public.rate_limit_counters(user_id, action, window_start);

-- RLS
alter table public.rate_limit_counters enable row level security;

-- Allow users to view their own counters (optional)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rate_limit_counters' AND policyname = 'Users can view own rate limits'
  ) THEN
    CREATE POLICY "Users can view own rate limits" ON public.rate_limit_counters
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to upsert their own counters
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rate_limit_counters' AND policyname = 'Users can manage own rate limits'
  ) THEN
    CREATE POLICY "Users can manage own rate limits" ON public.rate_limit_counters
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Update trigger for timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql security definer set search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rate_limit_updated_at'
  ) THEN
    CREATE TRIGGER trg_rate_limit_updated_at
    BEFORE UPDATE ON public.rate_limit_counters
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;