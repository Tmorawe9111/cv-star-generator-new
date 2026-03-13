-- Add new branches and skills for dynamic dropdown system

-- First, let's add skills for the new branches with status levels

-- Pflege (Healthcare) Skills
INSERT INTO skills (name, category, branch) VALUES
('Empathie', 'soft_skills', 'gesundheit'),
('Geduld', 'soft_skills', 'gesundheit'),
('Hygiene-Kenntnisse', 'technical', 'gesundheit'),
('Pflegeverständnis', 'technical', 'gesundheit'),
('Teamführung', 'leadership', 'gesundheit'),
('Belastbarkeit', 'soft_skills', 'gesundheit'),
('Verantwortungsbewusstsein', 'soft_skills', 'gesundheit'),
('Kommunikationsstärke', 'soft_skills', 'gesundheit'),
('Zuverlässigkeit', 'soft_skills', 'gesundheit');

-- IT Skills (additional to existing)
INSERT INTO skills (name, category, branch) VALUES
('Logisches Denken', 'soft_skills', 'it'),
('Technikinteresse', 'soft_skills', 'it'),
('Konzentration', 'soft_skills', 'it'),
('Problemlösung', 'soft_skills', 'it'),
('Eigenständigkeit', 'soft_skills', 'it'),
('Programmierkenntnisse', 'technical', 'it'),
('IT-Sicherheit', 'technical', 'it'),
('Datenbanken', 'technical', 'it');

-- Handwerk Skills (additional to existing)
INSERT INTO skills (name, category, branch) VALUES
('Handwerkliches Geschick', 'technical', 'handwerk'),
('Pünktlichkeit', 'soft_skills', 'handwerk'),
('Körperliche Fitness', 'physical', 'handwerk'),
('Motivation', 'soft_skills', 'handwerk'),
('Werkzeugkunde', 'technical', 'handwerk'),
('Materialverständnis', 'technical', 'handwerk'),
('Genauigkeit', 'technical', 'handwerk'),
('Selbstständigkeit', 'soft_skills', 'handwerk');

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
('Lernbereitschaft', 'soft_skills', 'universal'),
('Verantwortungsbewusstsein', 'soft_skills', 'universal'),
('Kommunikation', 'soft_skills', 'universal');

-- Add status_level column to skills table to differentiate between schueler, azubi, ausgelernt
ALTER TABLE skills ADD COLUMN status_level text DEFAULT 'all';

-- Update existing skills to have appropriate status levels
UPDATE skills SET status_level = 'all' WHERE status_level IS NULL;

-- Add some status-specific skills
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