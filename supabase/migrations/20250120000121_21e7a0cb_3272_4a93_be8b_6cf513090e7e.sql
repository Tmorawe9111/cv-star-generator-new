-- First, drop the existing check constraint on branch
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_branch_check;

-- Add a new check constraint that includes all the new branches
ALTER TABLE skills ADD CONSTRAINT skills_branch_check 
CHECK (branch IN ('handwerk', 'it', 'gesundheit', 'buero', 'verkauf', 'gastronomie', 'bau', 'universal'));

-- Add status_level column to skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS status_level text DEFAULT 'all';

-- Now add the new skills
-- Büro (Office) Skills
INSERT INTO skills (name, category, branch) VALUES
('Ordnung', 'soft_skills', 'buero'),
('Sorgfalt', 'soft_skills', 'buero'),
('Lernbereitschaft', 'soft_skills', 'buero'),
('Ausdrucksvermögen', 'soft_skills', 'buero'),
('MS Office', 'technical', 'buero'),
('Organisationstalent', 'soft_skills', 'buero'),
('Schriftverkehr', 'technical', 'buero'),
('Kommunikation', 'soft_skills', 'buero');

-- Verkauf (Sales) Skills
INSERT INTO skills (name, category, branch) VALUES
('Freundlichkeit', 'soft_skills', 'verkauf'),
('Kommunikationsfähigkeit', 'soft_skills', 'verkauf'),
('Auftreten', 'soft_skills', 'verkauf'),
('Zahlenverständnis', 'technical', 'verkauf'),
('Beratungskompetenz', 'technical', 'verkauf'),
('Kassensysteme', 'technical', 'verkauf'),
('Kundenumgang', 'soft_skills', 'verkauf'),
('Reklamationsmanagement', 'technical', 'verkauf');

-- Gastronomie Skills
INSERT INTO skills (name, category, branch) VALUES
('Schnelligkeit', 'physical', 'gastronomie'),
('Hygiene', 'technical', 'gastronomie'),
('Gästebetreuung', 'soft_skills', 'gastronomie'),
('Serviceverständnis', 'technical', 'gastronomie'),
('Zeitmanagement', 'soft_skills', 'gastronomie');

-- Bau (Construction) Skills
INSERT INTO skills (name, category, branch) VALUES
('Kraft', 'physical', 'bau'),
('Ausdauer', 'physical', 'bau'),
('Frühaufsteher', 'soft_skills', 'bau'),
('Maschinenbedienung', 'technical', 'bau'),
('Pläne lesen', 'technical', 'bau'),
('Baustellenerfahrung', 'technical', 'bau'),
('Materialkunde', 'technical', 'bau');

-- Universal Skills for all branches
INSERT INTO skills (name, category, branch) VALUES
('Eigeninitiative', 'soft_skills', 'universal'),
('Teamfähigkeit', 'soft_skills', 'universal'),
('Verantwortungsbewusstsein', 'soft_skills', 'universal');

-- Add additional skills for existing branches
INSERT INTO skills (name, category, branch) VALUES
-- Additional Gesundheit/Pflege skills
('Empathie', 'soft_skills', 'gesundheit'),
('Geduld', 'soft_skills', 'gesundheit'),
('Hygiene-Kenntnisse', 'technical', 'gesundheit'),
('Pflegeverständnis', 'technical', 'gesundheit'),
('Teamführung', 'leadership', 'gesundheit'),
('Belastbarkeit', 'soft_skills', 'gesundheit'),
('Kommunikationsstärke', 'soft_skills', 'gesundheit'),
('Zuverlässigkeit', 'soft_skills', 'gesundheit'),
-- Additional IT skills
('Logisches Denken', 'soft_skills', 'it'),
('Technikinteresse', 'soft_skills', 'it'),
('Konzentration', 'soft_skills', 'it'),
('Problemlösung', 'soft_skills', 'it'),
('Eigenständigkeit', 'soft_skills', 'it'),
('Programmierkenntnisse', 'technical', 'it'),
('IT-Sicherheit', 'technical', 'it'),
('Datenbanken', 'technical', 'it'),
-- Additional Handwerk skills
('Handwerkliches Geschick', 'technical', 'handwerk'),
('Pünktlichkeit', 'soft_skills', 'handwerk'),
('Körperliche Fitness', 'physical', 'handwerk'),
('Motivation', 'soft_skills', 'handwerk'),
('Werkzeugkunde', 'technical', 'handwerk'),
('Materialverständnis', 'technical', 'handwerk'),
('Genauigkeit', 'technical', 'handwerk'),
('Selbstständigkeit', 'soft_skills', 'handwerk');

-- Add status-specific skills
INSERT INTO skills (name, category, branch, status_level) VALUES
('Grundkenntnisse', 'technical', 'universal', 'schueler'),
('Praktische Erfahrung', 'technical', 'universal', 'azubi'),
('Führungsqualitäten', 'leadership', 'universal', 'ausgelernt'),
('Kundenorientierung', 'soft_skills', 'universal', 'ausgelernt'),
('Qualitätskontrolle', 'technical', 'universal', 'azubi');

-- Ensure we have common languages
INSERT INTO languages (name, code) VALUES
('Deutsch', 'de'),
('Englisch', 'en'),
('Französisch', 'fr'),
('Türkisch', 'tr'),
('Arabisch', 'ar'),
('Spanisch', 'es'),
('Russisch', 'ru'),
('Italienisch', 'it'),
('Polnisch', 'pl')
ON CONFLICT (name) DO NOTHING;