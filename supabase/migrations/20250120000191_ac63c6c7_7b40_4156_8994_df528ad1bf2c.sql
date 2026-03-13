-- Create table to allow companies (via members) to follow/show interest in users
create table if not exists public.company_user_interests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  user_id uuid not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

alter table public.company_user_interests enable row level security;

-- Company members can view interests for their companies; users can see companies interested in them
create policy "Company members can view interests" on public.company_user_interests
for select using (
  has_company_access(company_id) or user_id = auth.uid()
);

-- Company members can create interests on behalf of their company
create policy "Company members can insert interests" on public.company_user_interests
for insert with check (
  has_company_access(company_id) and created_by = auth.uid()
);

-- Company members can delete interests for their company
create policy "Company members can delete interests" on public.company_user_interests
for delete using (
  has_company_access(company_id)
);

-- Optional helpful index
create index if not exists idx_company_user_interests_company on public.company_user_interests(company_id);
create index if not exists idx_company_user_interests_user on public.company_user_interests(user_id);
