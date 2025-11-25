alter table companies
  add column if not exists stripe_customer_id text,
  add column if not exists available_tokens int default 0,
  add column if not exists monthly_tokens int default 0,
  add column if not exists plan_name text default 'basic' check (plan_name in ('basic','growth','bevis','bevis_pro')),
  add column if not exists plan_interval text default 'month' check (plan_interval in ('month','year')),
  add column if not exists seats_included int default 3,
  add column if not exists next_invoice_at timestamptz,
  add column if not exists auto_topup_enabled boolean default false,
  add column if not exists auto_topup_package text check (auto_topup_package in ('t15','t45','t100'));

create table if not exists purchases_v2 (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  kind text check (kind in ('plan','tokens')) not null,
  package_code text,
  amount_total_cents int not null,
  currency text default 'eur',
  status text,
  created_at timestamptz default now()
);

create table if not exists invoices_v2 (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  stripe_invoice_id text unique,
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  total_cents int,
  status text,
  created_at timestamptz default now()
);
