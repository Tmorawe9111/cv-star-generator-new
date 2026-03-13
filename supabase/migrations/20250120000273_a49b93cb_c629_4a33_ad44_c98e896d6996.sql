-- Branchen & Skills für Job Matching
create table if not exists industry (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table if not exists skill (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  is_soft boolean default false,
  created_at timestamptz default now()
);

create table if not exists industry_skill (
  industry_id uuid references industry(id) on delete cascade,
  skill_id uuid references skill(id) on delete cascade,
  relevance int check (relevance between 1 and 5) default 3,
  primary key (industry_id, skill_id)
);

-- Dokumente
create table if not exists document_type (
  slug text primary key,
  name text not null,
  category text default 'basis',
  created_at timestamptz default now()
);

-- Job Ads (neue matching-optimierte Struktur)
create table if not exists job_ad (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  industry_id uuid references industry(id),
  title text not null,
  job_family text not null,
  job_role text not null,
  seniority text not null,
  contract_type text not null,
  work_pattern text not null,
  shifts text[] default '{}',
  postal_code text,
  location_lat double precision,
  location_lng double precision,
  start_window daterange,
  compensation_min numeric,
  compensation_max numeric,
  comp_unit text,
  training_offered jsonb,
  upskilling_paths jsonb,
  company_fit_tags text[] default '{}',
  status text check (status in ('draft','published','paused')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_job_ad_industry on job_ad(industry_id);
create index if not exists idx_job_ad_status on job_ad(status);
create index if not exists idx_job_ad_company on job_ad(company_id);

-- Anforderungen: Skills, Zertifikate, Sprache, Dokumente
create table if not exists job_requirement (
  job_ad_id uuid references job_ad(id) on delete cascade,
  skill_id uuid references skill(id),
  level_required int check (level_required between 0 and 3),
  must_have boolean default false,
  is_soft boolean default false,
  primary key (job_ad_id, skill_id)
);

create table if not exists job_cert_required (
  job_ad_id uuid references job_ad(id) on delete cascade,
  cert_slug text,
  must_have boolean default true,
  primary key (job_ad_id, cert_slug)
);

create table if not exists job_language_required (
  job_ad_id uuid references job_ad(id) on delete cascade,
  lang text,
  min_cefr text,
  must_have boolean default true,
  primary key (job_ad_id, lang)
);

create table if not exists job_required_document (
  job_ad_id uuid references job_ad(id) on delete cascade,
  document_slug text references document_type(slug),
  must_have boolean default false,
  nice_to_have boolean default false,
  primary key (job_ad_id, document_slug)
);

-- RLS Policies
alter table industry enable row level security;
alter table skill enable row level security;
alter table industry_skill enable row level security;
alter table document_type enable row level security;
alter table job_ad enable row level security;
alter table job_requirement enable row level security;
alter table job_cert_required enable row level security;
alter table job_language_required enable row level security;
alter table job_required_document enable row level security;

-- Everyone can read reference data
create policy "Anyone can view industries" on industry for select using (true);
create policy "Anyone can view skills" on skill for select using (true);
create policy "Anyone can view industry_skills" on industry_skill for select using (true);
create policy "Anyone can view document_types" on document_type for select using (true);

-- Job ads: company members can manage their jobs
create policy "Company members can view their job ads" on job_ad 
  for select using (
    company_id in (select company_id from company_users where user_id = auth.uid())
  );

create policy "Company members can create job ads" on job_ad 
  for insert with check (
    company_id in (select company_id from company_users where user_id = auth.uid())
  );

create policy "Company members can update their job ads" on job_ad 
  for update using (
    company_id in (select company_id from company_users where user_id = auth.uid())
  );

create policy "Company members can delete their job ads" on job_ad 
  for delete using (
    company_id in (select company_id from company_users where user_id = auth.uid())
  );

-- Requirements follow job_ad access
create policy "Manage job requirements" on job_requirement for all using (
  job_ad_id in (select id from job_ad where company_id in (select company_id from company_users where user_id = auth.uid()))
);

create policy "Manage job certs" on job_cert_required for all using (
  job_ad_id in (select id from job_ad where company_id in (select company_id from company_users where user_id = auth.uid()))
);

create policy "Manage job languages" on job_language_required for all using (
  job_ad_id in (select id from job_ad where company_id in (select company_id from company_users where user_id = auth.uid()))
);

create policy "Manage job documents" on job_required_document for all using (
  job_ad_id in (select id from job_ad where company_id in (select company_id from company_users where user_id = auth.uid()))
);

-- Upsert function
create or replace function upsert_job_ad_with_requirements(
  p_job jsonb,
  p_status text default 'draft'
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid := coalesce((p_job->>'id')::uuid, gen_random_uuid());
begin
  -- 1) Basisanzeige upsert
  insert into job_ad (
    id, company_id, industry_id, title, job_family, job_role, seniority,
    contract_type, work_pattern, shifts, postal_code, location_lat, location_lng,
    start_window, compensation_min, compensation_max, comp_unit,
    training_offered, upskilling_paths, company_fit_tags, status
  ) values (
    v_id,
    (p_job->>'company_id')::uuid,
    (p_job->>'industry_id')::uuid,
    p_job->>'title',
    p_job->>'job_family',
    p_job->>'job_role',
    p_job->>'seniority',
    p_job->>'contract_type',
    p_job->>'work_pattern',
    coalesce((select array_agg(x::text) from jsonb_array_elements_text(p_job->'shifts') x), '{}'),
    p_job->>'postal_code',
    nullif(p_job->>'location_lat','')::double precision,
    nullif(p_job->>'location_lng','')::double precision,
    daterange( nullif(p_job->>'start_window_earliest','')::date
             , nullif(p_job->>'start_window_latest','')::date, '[]'),
    nullif(p_job->>'compensation_min','')::numeric,
    nullif(p_job->>'compensation_max','')::numeric,
    p_job->>'comp_unit',
    p_job->'training_offered',
    p_job->'upskilling_paths',
    coalesce((select array_agg(x::text) from jsonb_array_elements_text(p_job->'company_fit_tags') x), '{}'),
    p_status
  )
  on conflict (id) do update set
    industry_id = excluded.industry_id,
    title = excluded.title,
    job_family = excluded.job_family,
    job_role = excluded.job_role,
    seniority = excluded.seniority,
    contract_type = excluded.contract_type,
    work_pattern = excluded.work_pattern,
    shifts = excluded.shifts,
    postal_code = excluded.postal_code,
    location_lat = excluded.location_lat,
    location_lng = excluded.location_lng,
    start_window = excluded.start_window,
    compensation_min = excluded.compensation_min,
    compensation_max = excluded.compensation_max,
    comp_unit = excluded.comp_unit,
    training_offered = excluded.training_offered,
    upskilling_paths = excluded.upskilling_paths,
    company_fit_tags = excluded.company_fit_tags,
    status = excluded.status,
    updated_at = now()
  ;

  -- 2) Anforderungen neu setzen
  delete from job_requirement where job_ad_id = v_id;
  insert into job_requirement(job_ad_id, skill_id, level_required, must_have, is_soft)
  select v_id,
         (elem->>'skill_id')::uuid,
         coalesce((elem->>'level_required')::int, 0),
         coalesce((elem->>'must_have')::boolean, false),
         coalesce((elem->>'is_soft')::boolean, false)
  from jsonb_array_elements(coalesce(p_job->'requirements','[]'::jsonb)) elem;

  delete from job_language_required where job_ad_id = v_id;
  insert into job_language_required(job_ad_id, lang, min_cefr, must_have)
  select v_id, elem->>'lang', elem->>'min_cefr', coalesce((elem->>'must_have')::boolean, true)
  from jsonb_array_elements(coalesce(p_job->'language_requirements','[]'::jsonb)) elem;

  delete from job_cert_required where job_ad_id = v_id;
  insert into job_cert_required(job_ad_id, cert_slug, must_have)
  select v_id, elem->>'cert_slug', coalesce((elem->>'must_have')::boolean, true)
  from jsonb_array_elements(coalesce(p_job->'certs_required','[]'::jsonb)) elem;

  delete from job_required_document where job_ad_id = v_id;
  insert into job_required_document(job_ad_id, document_slug, must_have, nice_to_have)
  select v_id, elem->>'document_slug',
         coalesce((elem->>'must_have')::boolean, false),
         coalesce((elem->>'nice_to_have')::boolean, false)
  from jsonb_array_elements(coalesce(p_job->'documents','[]'::jsonb)) elem;

  return v_id;
end $$;

-- Seed data: Industries
insert into industry (name) values 
  ('Elektro'),
  ('Pflege'),
  ('Logistik'),
  ('Gastro'),
  ('Bau')
on conflict (name) do nothing;

-- Seed data: Document types
insert into document_type (slug, name, category) values 
  ('lebenslauf', 'Lebenslauf', 'basis'),
  ('anschreiben', 'Anschreiben', 'basis'),
  ('zeugnis', 'Zeugnis', 'basis'),
  ('fuehrerschein_B', 'Führerschein Klasse B', 'lizenz'),
  ('staplerschein', 'Staplerschein', 'lizenz'),
  ('gesundheitszeugnis', 'Gesundheitszeugnis', 'pflege'),
  ('erste_hilfe', 'Erste-Hilfe-Kurs', 'zusatz')
on conflict (slug) do nothing;

-- Seed data: Skills (Beispiele für jede Branche)
insert into skill (slug, name, category, is_soft) values 
  -- Elektro
  ('elektro_installation', 'Elektroinstallation', 'elektro', false),
  ('schaltplaene_lesen', 'Schaltpläne lesen', 'elektro', false),
  ('vde_normen', 'VDE-Normen', 'elektro', false),
  ('photovoltaik', 'Photovoltaik', 'elektro', false),
  -- Pflege
  ('grundpflege', 'Grundpflege', 'pflege', false),
  ('medikamentengabe', 'Medikamentengabe', 'pflege', false),
  ('dokumentation_pflege', 'Pflegedokumentation', 'pflege', false),
  ('wundversorgung', 'Wundversorgung', 'pflege', false),
  -- Logistik
  ('stapler_fahren', 'Staplerfahren', 'logistik', false),
  ('warenwirtschaft', 'Warenwirtschaft', 'logistik', false),
  ('kommissionierung', 'Kommissionierung', 'logistik', false),
  ('versandabwicklung', 'Versandabwicklung', 'logistik', false),
  -- Gastro
  ('kochtechniken', 'Kochtechniken', 'gastro', false),
  ('hygiene_haccp', 'Hygiene & HACCP', 'gastro', false),
  ('kalkulation_gastro', 'Kalkulation', 'gastro', false),
  ('servieren', 'Servieren', 'gastro', false),
  -- Bau
  ('maurerarbeiten', 'Maurerarbeiten', 'bau', false),
  ('trockenbau', 'Trockenbau', 'bau', false),
  ('bauplaene_lesen', 'Baupläne lesen', 'bau', false),
  ('geruest_aufbau', 'Gerüstaufbau', 'bau', false),
  -- Soft Skills
  ('teamfaehigkeit', 'Teamfähigkeit', 'soft', true),
  ('zuverlaessigkeit', 'Zuverlässigkeit', 'soft', true),
  ('kommunikation', 'Kommunikation', 'soft', true),
  ('lernbereitschaft', 'Lernbereitschaft', 'soft', true)
on conflict (slug) do nothing;