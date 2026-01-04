# Profil-Wiederherstellung: Was ist passiert und wie kann man es beheben?

## Was ist passiert?

### Das Problem:
1. **Susanne** versuchte, ein neues Profil mit einer E-Mail zu erstellen
2. Diese E-Mail existierte bereits in `auth.users` (z.B. von **Alina**)
3. Der alte Code versuchte automatisch, sich mit dieser E-Mail anzumelden
4. Wenn das Passwort zufällig stimmte (oder es einen Bug gab), wurde sich mit **Alinas** Account angemeldet
5. Dann wurde **Alinas** Profil mit **Susannes** Daten überschrieben

### Warum "existierender E-Mail"?
- "Existierender E-Mail" bedeutet: Die E-Mail-Adresse ist bereits in der Datenbank registriert
- Supabase verhindert normalerweise doppelte E-Mails in `auth.users`
- Aber der alte Code hat versucht, sich trotzdem anzumelden, statt einen Fehler zu zeigen

## Ist das ein Supabase-Problem?

**Nein, das war ein Code-Problem:**
- Supabase hat korrekt verhindert, dass die E-Mail doppelt verwendet wird
- Der Fehler "User already registered" wurde korrekt zurückgegeben
- **Aber**: Der Code hat diesen Fehler falsch behandelt und versucht, sich anzumelden
- Das `.update()` Statement hat dann das falsche Profil überschrieben

## Wie kann man Susannes Profil wiederherstellen?

### Option 1: Supabase Dashboard (Empfohlen)

1. **Gehe zu Supabase Dashboard** → Deine Datenbank
2. **Öffne die `profiles` Tabelle**
3. **Suche nach Alinas Profil** (mit Susannes Daten):
   ```sql
   SELECT id, email, vorname, nachname, updated_at 
   FROM profiles 
   WHERE vorname = 'Susanne' OR nachname = 'Susanne'
   ORDER BY updated_at DESC;
   ```
4. **Prüfe `updated_at`**: Das neueste Update ist wahrscheinlich das überschriebene Profil
5. **Suche nach Alinas ursprünglichen Daten** in anderen Tabellen:
   - `data_access_log` (wenn Unternehmen das Profil angesehen haben)
   - `profile_unlocks` (wenn das Profil freigeschaltet wurde)
   - `company_candidates` (wenn es in der Kandidatensuche war)

### Option 2: SQL-Abfrage für Wiederherstellung

```sql
-- 1. Finde Alinas User-ID (die überschrieben wurde)
SELECT id, email, vorname, nachname, updated_at, created_at
FROM profiles
WHERE email = 'alina@example.com'  -- Alinas E-Mail
ORDER BY updated_at DESC;

-- 2. Prüfe, ob es Backup-Daten in anderen Tabellen gibt
SELECT * FROM data_access_log 
WHERE profile_id = 'ALINAS_USER_ID'
ORDER BY at DESC;

-- 3. Prüfe, ob es ein separates Profil für Susanne gibt
SELECT id, email, vorname, nachname 
FROM profiles 
WHERE email = 'susanne@example.com';  -- Susannes E-Mail

-- 4. Wenn Susanne ein separates Profil hat, aber die Daten falsch sind:
-- Aktualisiere Alinas Profil mit den ursprünglichen Daten (falls bekannt)
UPDATE profiles
SET 
  vorname = 'Alina',  -- Original-Name
  nachname = '...',   -- Original-Name
  -- ... andere Felder
WHERE id = 'ALINAS_USER_ID';
```

### Option 3: Manuelle Wiederherstellung

1. **Kontaktiere Alina** und bitte sie, ihre Daten erneut einzugeben
2. **Erstelle ein neues Profil für Susanne** mit einer anderen E-Mail
3. **Verwende die neuen Sicherheitsmaßnahmen**, um sicherzustellen, dass dies nicht mehr passiert

## Was wurde jetzt gefixt?

### ✅ Neue Sicherheitsmaßnahmen:

1. **Kein automatischer Login mehr**: Wenn eine E-Mail existiert, wird ein Fehler angezeigt
2. **E-Mail-Validierung**: Prüft vor jedem Update, ob die E-Mail übereinstimmt
3. **Ownership-Verification**: Prüft vor jedem Update, ob das Profil dem User gehört
4. **Upsert statt Update**: Verwendet `.upsert()` mit Konfliktbehandlung
5. **Finale Verifikation**: Prüft nach dem Update, ob alles korrekt ist

### 🔒 Verhindert jetzt:

- ✅ Überschreibung fremder Profile
- ✅ Race Conditions
- ✅ Unbefugte Updates
- ✅ Mobile-spezifische Probleme

## Nächste Schritte:

1. **Prüfe die Datenbank** auf überschriebene Profile
2. **Stelle die Daten wieder her** (falls möglich)
3. **Teste die neuen Sicherheitsmaßnahmen** mit einem Test-Account
4. **Informiere betroffene Benutzer** über das Problem

## SQL-Query zum Finden betroffener Profile:

```sql
-- Finde Profile, die kürzlich aktualisiert wurden und möglicherweise überschrieben wurden
SELECT 
  p.id,
  p.email,
  p.vorname,
  p.nachname,
  p.updated_at,
  p.created_at,
  u.email as auth_email,
  CASE 
    WHEN p.email != u.email THEN 'EMAIL_MISMATCH'
    ELSE 'OK'
  END as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.updated_at > NOW() - INTERVAL '7 days'
ORDER BY p.updated_at DESC;
```

Diese Query findet Profile, die in den letzten 7 Tagen aktualisiert wurden und möglicherweise Probleme haben.

