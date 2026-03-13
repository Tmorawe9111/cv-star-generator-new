-- 1) LANGUAGES MASTER
create table if not exists public.languages_master (
  code text primary key,
  name_de text not null,
  name_en text not null
);

-- Enable RLS and restrict to authenticated SELECT
alter table public.languages_master enable row level security;
create policy if not exists "Languages master viewable by authenticated users"
  on public.languages_master for select
  using (auth.role() = 'authenticated');

-- Seed values
insert into public.languages_master (code, name_de, name_en) values
('de','Deutsch','German'),
('en','Englisch','English'),
('tr','Türkisch','Turkish'),
('ar','Arabisch','Arabic'),
('pl','Polnisch','Polish'),
('ru','Russisch','Russian'),
('fr','Französisch','French'),
('es','Spanisch','Spanish'),
('it','Italienisch','Italian'),
('pt','Portugiesisch','Portuguese'),
('ro','Rumänisch','Romanian'),
('bg','Bulgarisch','Bulgarian'),
('nl','Niederländisch','Dutch'),
('cs','Tschechisch','Czech'),
('el','Griechisch','Greek'),
('uk','Ukrainisch','Ukrainian'),
('zh','Chinesisch','Chinese'),
('fa','Persisch (Farsi)','Persian (Farsi)'),
('hi','Hindi','Hindi')
on conflict (code) do nothing;

-- 2) SKILLS MASTER
create table if not exists public.skills_master (
  id bigserial primary key,
  name text unique not null,
  name_de text,
  category text
);

-- Enable RLS and restrict to authenticated SELECT
alter table public.skills_master enable row level security;
create policy if not exists "Skills master viewable by authenticated users"
  on public.skills_master for select
  using (auth.role() = 'authenticated');

-- Helpful index
create index if not exists skills_master_category_idx on public.skills_master (category);

-- Seed values
insert into public.skills_master (name, name_de, category) values
('Communication','Kommunikation','soft'),
('Teamwork','Teamarbeit','soft'),
('Problem Solving','Problemlösung','soft'),
('Time Management','Zeitmanagement','soft'),
('Adaptability','Anpassungsfähigkeit','soft'),
('Customer Service','Kundenservice','soft'),
('Leadership','Führung','soft'),
('Attention to Detail','Detailgenauigkeit','soft'),
('Microsoft Excel','Microsoft Excel','tool'),
('Microsoft Word','Microsoft Word','tool'),
('Microsoft PowerPoint','Microsoft PowerPoint','tool'),
('Google Sheets','Google Tabellen','tool'),
('Notion','Notion','tool'),
('Figma','Figma','tool'),
('HTML/CSS','HTML/CSS','technical'),
('JavaScript','JavaScript','technical'),
('TypeScript','TypeScript','technical'),
('React','React','technical'),
('Node.js','Node.js','technical'),
('Python','Python','technical'),
('Java','Java','technical'),
('SQL','SQL','technical'),
('Git','Git','technical'),
('Forklift Operation','Gabelstaplerbedienung','technical'),
('Electrical Basics','Elektrogrundlagen','technical'),
('CNC Machining','CNC-Bearbeitung','technical'),
('Welding','Schweißen','technical'),
('HVAC Basics','Klima-/Heizungstechnik (Grundlagen)','technical'),
('Quality Control','Qualitätskontrolle','technical'),
('Inventory Management','Bestandsmanagement','technical'),
('Safety Compliance','Arbeitssicherheit','technical'),
('Sales','Vertrieb','technical'),
('CRM (e.g., HubSpot)','CRM (z. B. HubSpot)','tool'),
('SEO Basics','SEO-Grundlagen','technical'),
('Content Writing','Texterstellung','technical'),
('Project Management','Projektmanagement','technical')
on conflict (name) do nothing;