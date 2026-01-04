# Quick Stress Test (Kleiner Test zuerst)

## Schneller Test mit 100 Nutzern

Bevor du den großen Test mit 10.000 Nutzern machst, teste zuerst mit 100:

```bash
# 1. Gehe ins stress-test Verzeichnis
cd stress-test

# 2. Führe den Quick Test aus
k6 run --vus 100 --duration 2m k6-signup-test.js
```

## Was wird getestet?

1. ✅ Sign-up Endpoint
2. ✅ Profile Creation
3. ✅ Feed Loading

## Erwartete Ergebnisse

- **Response Time**: < 2 Sekunden (95th percentile)
- **Error Rate**: < 5%
- **Success Rate**: > 95%

## Wenn der Quick Test erfolgreich ist:

1. Prüfe die Datenbank-Performance
2. Prüfe Supabase Dashboard auf Rate Limits
3. Führe dann den vollständigen Test aus

## Monitoring während des Tests

1. **Supabase Dashboard**: 
   - Auth > Users (wachsende Anzahl)
   - Database > Tables > profiles (wachsende Anzahl)
   - Logs > API Logs (Fehler prüfen)

2. **Vercel Dashboard**:
   - Functions > Logs (wenn Serverless Functions verwendet werden)

3. **Database**:
   ```sql
   -- Führe während des Tests aus:
   SELECT COUNT(*) FROM profiles WHERE email LIKE 'test-%@stress-test.com';
   ```

## Nach dem Test

1. Prüfe die Ergebnisse in `stress-test-results.json`
2. Führe `cleanup-test-users.sql` aus, um Test-User zu löschen
3. Analysiere Performance-Bottlenecks

