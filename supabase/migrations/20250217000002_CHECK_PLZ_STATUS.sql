-- Prüfe aktuellen Stand der PLZs in der Datenbank
-- Führe diese Abfrage im Supabase SQL Editor aus

-- 1. Gesamtanzahl der PLZs
SELECT 
  COUNT(*) as total_plz,
  COUNT(DISTINCT plz) as unique_plz
FROM postal_codes;

-- 2. PLZs mit Koordinaten
SELECT 
  COUNT(*) as plz_with_coords,
  COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM postal_codes), 0) as percentage_with_coords
FROM postal_codes 
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- 3. PLZs ohne Koordinaten
SELECT 
  COUNT(*) as plz_without_coords
FROM postal_codes 
WHERE latitude IS NULL 
  OR longitude IS NULL;

-- 4. PLZs mit Städtenamen (nicht nur PLZ als Ort)
SELECT 
  COUNT(*) as plz_with_city_name
FROM postal_codes 
WHERE ort IS NOT NULL 
  AND ort != plz 
  AND ort != '';

-- 5. Beispiel-PLZs (erste 20)
SELECT 
  plz, 
  ort, 
  bundesland, 
  latitude, 
  longitude,
  CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_coords
FROM postal_codes 
ORDER BY plz 
LIMIT 20;

-- 6. Statistiken nach Bundesland
SELECT 
  bundesland,
  COUNT(*) as anzahl_plz,
  COUNT(latitude) as mit_koordinaten,
  COUNT(*) - COUNT(latitude) as ohne_koordinaten
FROM postal_codes
GROUP BY bundesland
ORDER BY anzahl_plz DESC;

