
-- 1) Marketplace core table with FTS
create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('occupation','post','group')),
  title text not null,
  subtitle text,
  description text,
  image_url text,
  location text,
  company_id uuid references public.companies(id) on delete set null,
  author_profile_id uuid references public.profiles(id) on delete set null,
  tags text[] not null default '{}',
  visibility text not null default 'CommunityAndCompanies'
    check (visibility in ('CommunityOnly','CommunityAndCompanies')),
  created_at timestamptz not null default now(),
  -- Generated full-text search column
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
    || setweight(to_tsvector('simple', array_to_string(coalesce(tags, '{}'), ' ')), 'C')
  ) stored
);

-- Helpful indexes
create index if not exists idx_marketplace_items_type_created_at
  on public.marketplace_items (type, created_at desc);

create index if not exists idx_marketplace_items_company_id
  on public.marketplace_items (company_id);

create index if not exists idx_marketplace_items_visibility
  on public.marketplace_items (visibility);

create index if not exists idx_marketplace_items_search_tsv
  on public.marketplace_items using gin (search_tsv);

-- RLS: readable by everyone subject to visibility; only owners can manage their own posts
alter table public.marketplace_items enable row level security;

-- Public read: CommunityAndCompanies is always visible; CommunityOnly requires auth
create policy "Marketplace readable per visibility"
on public.marketplace_items
for select
using (
  visibility = 'CommunityAndCompanies'
  or auth.role() = 'authenticated'
);

-- Authenticated users can insert their own posts only
create policy "Users can create their own marketplace posts"
on public.marketplace_items
for insert
to authenticated
with check (
  type = 'post' and author_profile_id = auth.uid()
);

-- Owners can update/delete their own posts
create policy "Owners can update their own marketplace posts"
on public.marketplace_items
for update
to authenticated
using (type = 'post' and author_profile_id = auth.uid());

create policy "Owners can delete their own marketplace posts"
on public.marketplace_items
for delete
to authenticated
using (type = 'post' and author_profile_id = auth.uid());



-- 2) Categories
create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.marketplace_categories enable row level security;

-- Public read only
create policy if not exists "Marketplace categories are public readable"
on public.marketplace_categories
for select
using (true);



-- 3) Item-category mapping
create table if not exists public.marketplace_item_categories (
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  category_id uuid not null references public.marketplace_categories(id) on delete cascade,
  primary key (item_id, category_id)
);

alter table public.marketplace_item_categories enable row level security;

-- Public read only
create policy if not exists "Marketplace item-categories are public readable"
on public.marketplace_item_categories
for select
using (true);

create index if not exists idx_marketplace_item_categories_cat
  on public.marketplace_item_categories (category_id);



-- 4) Groups (for trending list)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  member_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- Public read only
create policy if not exists "Groups are public readable"
on public.groups
for select
using (true);



-- 5) Seed data (dummy; safe to delete later)
-- Companies
with
ins_companies as (
  insert into public.companies (id, name, primary_email, main_location, country, size_range, plan_type, subscription_status, active_tokens, seats, account_status)
  values
    (gen_random_uuid(), 'KraftWerk Elektrotechnik GmbH', 'info@kraftwerk-elektro.example', 'Berlin', 'DE', '51-200', 'basic', 'inactive', 0, 1, 'pending'),
    (gen_random_uuid(), 'BüroPlus Verwaltung AG', 'kontakt@bueroplus.example', 'Hamburg', 'DE', '51-200', 'basic', 'inactive', 0, 1, 'pending'),
    (gen_random_uuid(), 'MechaMotion Industrie KG', 'hello@mechamotion.example', 'München', 'DE', '51-200', 'basic', 'inactive', 0, 1, 'pending')
  returning id, name
),
comp as (
  select
    max(case when name = 'KraftWerk Elektrotechnik GmbH' then id end) as kraftwerk_id,
    max(case when name = 'BüroPlus Verwaltung AG' then id end) as bueroplus_id,
    max(case when name = 'MechaMotion Industrie KG' then id end) as mechamotion_id
  from ins_companies
),
-- Categories
ins_categories as (
  insert into public.marketplace_categories (id, slug, label)
  values
    (gen_random_uuid(), 'electrician', 'Elektriker/in'),
    (gen_random_uuid(), 'office-management', 'Kauffrau/Kaufmann für Büromanagement'),
    (gen_random_uuid(), 'industrial-mechanic', 'Industriemechaniker/in'),
    (gen_random_uuid(), 'nursing', 'Pflegefachkraft'),
    (gen_random_uuid(), 'it-specialist', 'Fachinformatiker/in'),
    (gen_random_uuid(), 'mechatronics', 'Mechatroniker/in'),
    (gen_random_uuid(), 'retail-sales', 'Verkäufer/in'),
    (gen_random_uuid(), 'hotel-management', 'Hotelfachmann/-frau')
  returning id, slug
),
cats as (
  select
    max(case when slug = 'electrician' then id end) as c_electrician,
    max(case when slug = 'office-management' then id end) as c_office,
    max(case when slug = 'industrial-mechanic' then id end) as c_ind_mech,
    max(case when slug = 'nursing' then id end) as c_nursing,
    max(case when slug = 'it-specialist' then id end) as c_it,
    max(case when slug = 'mechatronics' then id end) as c_mecha,
    max(case when slug = 'retail-sales' then id end) as c_retail,
    max(case when slug = 'hotel-management' then id end) as c_hotel
  from ins_categories
),
-- Groups
ins_groups as (
  insert into public.groups (id, name, avatar_url, member_count)
  values
    (gen_random_uuid(), 'Elektriker Lerncommunity', '/placeholder.svg', 842),
    (gen_random_uuid(), 'Office Management Study Group', '/placeholder.svg', 521),
    (gen_random_uuid(), 'IT Azubi Austausch', '/placeholder.svg', 1294)
  returning id, name
),
grp as (
  select
    max(case when name = 'Elektriker Lerncommunity' then id end) as g_electric,
    max(case when name = 'Office Management Study Group' then id end) as g_office,
    max(case when name = 'IT Azubi Austausch' then id end) as g_it
  from ins_groups
),
-- Occupation items
ins_items as (
  insert into public.marketplace_items (id, type, title, subtitle, description, image_url, location, company_id, tags, visibility)
  values
    (gen_random_uuid(), 'occupation', 'Elektriker/in (Apprenticeship)', '2-3 Jahre • Wartung & Sicherheit', 'Du arbeitest mit elektrischen Anlagen, führst Installationen durch und sorgst für Sicherheit.', '/images/step1.jpg', 'Berlin', (select kraftwerk_id from comp), array['first-year','dual','near-me'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Kauffrau/Kaufmann für Büromanagement', 'Organisation • Kommunikation • Rechnungswesen', 'Du koordinierst Abläufe, kommunizierst mit Kunden und unterstützt im Büroalltag.', '/images/step2.jpg', 'Hamburg', (select bueroplus_id from comp), array['full-time','office','admin'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Industriemechaniker/in (Ausbildung)', 'Fertigung • Montage • Wartung', 'Fertige Bauteile, montiere technische Systeme und halte Maschinen instand.', '/images/step3.jpg', 'München', (select mechamotion_id from comp), array['dual','first-year'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Pflegefachkraft (Ausbildung)', 'Menschen helfen • Pflege planen', 'Du unterstützt Patient/innen, planst Pflegemaßnahmen und arbeitest im Team.', '/images/step1-hero.jpg', 'Köln', null, array['near-me','full-time'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Fachinformatiker/in (Systemintegration)', 'Netzwerke • Support', 'Plane und betreue IT-Systeme, löse Störungen und unterstütze Nutzer/innen.', '/images/step1.jpg', 'Stuttgart', null, array['it','full-time'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Mechatroniker/in (Ausbildung)', 'Mechanik • Elektronik', 'Verbinde Mechanik & Elektronik, baue Anlagen und führst Wartungen durch.', '/images/step2.jpg', 'Dresden', null, array['dual','first-year'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Verkäufer/in (Einzelhandel)', 'Beratung • Kasse • Warenpflege', 'Berate Kund/innen, kassiere und präsentiere Ware ansprechend.', '/images/step3.jpg', 'Leipzig', null, array['full-time'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'occupation', 'Hotelfachmann/-frau (Ausbildung)', 'Service • Rezeption', 'Begrüße Gäste, plane Veranstaltungen und sorge für einen reibungslosen Ablauf.', '/images/step1-hero.jpg', 'Frankfurt', null, array['service','dual'], 'CommunityAndCompanies'),
    -- Posts (author_profile_id left NULL for seed)
    (gen_random_uuid(), 'post', 'Tipps für die Bewerbung', null, 'Achte auf eine klare Struktur, konkrete Erfahrungen und Motivation!', '/placeholder.svg', null, null, array['application-tips'], 'CommunityOnly'),
    (gen_random_uuid(), 'post', 'Mein erster Ausbildungstag', null, 'Heute gestartet – super nettes Team und spannende Aufgaben!', '/placeholder.svg', null, null, array['first-year'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'post', 'IT-Azubi: Lernressourcen', null, 'Teilt eure besten Tutorials und Kurse für Netzwerke und Linux.', '/placeholder.svg', null, null, array['it'], 'CommunityAndCompanies'),
    -- Groups
    (gen_random_uuid(), 'group', 'Elektriker Lerncommunity', null, 'Gruppe für Elektriker-Azubis zum Austausch und Lernen.', '/placeholder.svg', null, null, array['electrician'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'group', 'Office Management Study Group', null, 'Gemeinsam lernen und Erfahrungen teilen im Büromanagement.', '/placeholder.svg', null, null, array['office'], 'CommunityAndCompanies'),
    (gen_random_uuid(), 'group', 'IT Azubi Austausch', null, 'Fragen, Tipps und Ressourcen für IT-Azubis.', '/placeholder.svg', null, null, array['it'], 'CommunityAndCompanies')
  returning id, title
),
-- Map item titles to ids (for easy linking to categories)
itm as (
  select
    max(case when title like 'Elektriker/in (Apprenticeship)%' then id end) as i_electrician,
    max(case when title like 'Kauffrau/Kaufmann für Büromanagement%' then id end) as i_office,
    max(case when title like 'Industriemechaniker/in (Ausbildung)%' then id end) as i_ind_mech,
    max(case when title like 'Pflegefachkraft (Ausbildung)%' then id end) as i_nursing,
    max(case when title like 'Fachinformatiker/in (Systemintegration)%' then id end) as i_it,
    max(case when title like 'Mechatroniker/in (Ausbildung)%' then id end) as i_mecha,
    max(case when title like 'Verkäufer/in (Einzelhandel)%' then id end) as i_retail,
    max(case when title like 'Hotelfachmann/-frau (Ausbildung)%' then id end) as i_hotel
  from ins_items
)
-- Insert item-category links
insert into public.marketplace_item_categories (item_id, category_id)
select i_electrician, c_electrician from itm, cats where i_electrician is not null
union all
select i_office, c_office from itm, cats where i_office is not null
union all
select i_ind_mech, c_ind_mech from itm, cats where i_ind_mech is not null
union all
select i_nursing, c_nursing from itm, cats where i_nursing is not null
union all
select i_it, c_it from itm, cats where i_it is not null
union all
select i_mecha, c_mecha from itm, cats where i_mecha is not null
union all
select i_retail, c_retail from itm, cats where i_retail is not null
union all
select i_hotel, c_hotel from itm, cats where i_hotel is not null
;
