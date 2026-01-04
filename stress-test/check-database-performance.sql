-- Database Performance Check für Stress Test
-- Führe diese Queries vor und nach dem Stress Test aus

-- 1. Anzahl der Profile
SELECT COUNT(*) as total_profiles FROM profiles;

-- 2. Anzahl der Profile nach Status
SELECT status, COUNT(*) as count 
FROM profiles 
GROUP BY status 
ORDER BY count DESC;

-- 3. Profile pro Tag (letzte 7 Tage)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as profiles_created
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 4. Durchschnittliche Profil-Erstellungszeit
SELECT 
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_creation_time_seconds
FROM profiles
WHERE profile_complete = true;

-- 5. Index-Status prüfen
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'posts', 'connections')
ORDER BY idx_scan DESC;

-- 6. Tabelle-Größen
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'posts', 'connections', 'auth.users')
ORDER BY size_bytes DESC;

-- 7. Langsame Queries (wenn pg_stat_statements aktiviert ist)
-- SELECT 
--   query,
--   calls,
--   total_exec_time,
--   mean_exec_time,
--   max_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%profiles%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- 8. Connection Pool Status
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = current_database();

-- 9. Lock-Status (während des Tests)
SELECT 
  locktype,
  mode,
  COUNT(*) as count
FROM pg_locks
GROUP BY locktype, mode
ORDER BY count DESC;

-- 10. RLS Policy Performance Check
EXPLAIN ANALYZE
SELECT * FROM profiles 
WHERE id IN (
  SELECT id FROM profiles LIMIT 100
);

