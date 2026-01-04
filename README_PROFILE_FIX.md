# Profil-E-Mail-Synchronisation - Reparatur-Anleitung

## Problem

Wenn sich ein Benutzer (z.B. Susanne) mit `susanne@web.de` anmeldet, aber das Profil in der `profiles` Tabelle noch eine andere E-Mail (z.B. von Alina) hat, wird der falsche Name angezeigt.

## Ursache

1. **E-Mail-Synchronisation fehlt**: Die E-Mail in `profiles` wird nicht automatisch mit `auth.users` synchronisiert
2. **Profil wird per ID geladen**: Beim Login wird das Profil per `user.id` geladen, nicht per E-Mail
3. **Update ohne Validierung**: Wenn ein Profil aktualisiert wird, wird nicht geprüft, ob die E-Mail mit `auth.users` übereinstimmt

## Lösung

### Schritt 1: Datenbank prüfen

Führe die Queries in `DIAGNOSE_PROFILE_ISSUES.sql` aus:

1. Öffne **Supabase Dashboard** → **SQL Editor**
2. Kopiere den Inhalt von `DIAGNOSE_PROFILE_ISSUES.sql`
3. Führe die Queries aus, um betroffene Profile zu finden

**Wichtigste Query:**
```sql
-- Finde alle Profile mit E-Mail-Konflikten
SELECT 
  p.id,
  p.email as profile_email,
  p.vorname,
  p.nachname,
  u.email as auth_email,
  CASE 
    WHEN p.email IS DISTINCT FROM LOWER(TRIM(u.email)) THEN '❌ MISMATCH'
    ELSE '✅ OK'
  END as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email IS DISTINCT FROM LOWER(TRIM(u.email))
ORDER BY p.updated_at DESC;
```

### Schritt 2: Migration ausführen

Die Migration `20250120000000_fix_profile_email_sync.sql` wurde erstellt. Sie:

1. **Repariert bestehende Mismatches**: Synchronisiert alle E-Mails von `auth.users` zu `profiles`
2. **Erstellt Trigger**: Automatische Synchronisation bei zukünftigen Updates
3. **Erstellt Monitoring-View**: `profile_email_mismatches` zum Überwachen

**So führst du die Migration aus:**

```bash
# Option 1: Via Supabase CLI (wenn installiert)
supabase db push

# Option 2: Manuell in Supabase Dashboard
# 1. Gehe zu Supabase Dashboard → SQL Editor
# 2. Kopiere den Inhalt von supabase/migrations/20250120000000_fix_profile_email_sync.sql
# 3. Führe das Script aus
```

### Schritt 3: Manuelle Reparatur (falls nötig)

Falls die Migration nicht automatisch läuft, verwende `FIX_PROFILE_EMAILS.sql`:

1. Öffne **Supabase Dashboard** → **SQL Editor**
2. Kopiere den Inhalt von `FIX_PROFILE_EMAILS.sql`
3. **WICHTIG**: Entferne die Kommentare (`/* */`) um die UPDATE-Statements, um sie auszuführen
4. Führe das Script aus

### Schritt 4: Spezifisches Profil reparieren

Um ein spezifisches Profil zu reparieren (z.B. Alina/Susanne):

```sql
-- Finde die User-ID
SELECT id, email, vorname, nachname 
FROM profiles 
WHERE email LIKE '%alina%' OR email LIKE '%susanne%' 
   OR vorname LIKE '%Alina%' OR vorname LIKE '%Susanne%';

-- Repariere das Profil (ersetze USER_ID mit der tatsächlichen ID)
SELECT public.fix_profile_email('USER_ID_HERE');
```

## Was wurde im Code gefixt?

### 1. **useAuth.tsx** - E-Mail-Synchronisation beim Login
- Prüft beim Laden des Profils, ob die E-Mail mit `auth.users` übereinstimmt
- Synchronisiert automatisch, wenn nicht

### 2. **ProfileCreationModal.tsx** - E-Mail-Validierung
- Prüft, ob die E-Mail im Formular mit `auth.users` übereinstimmt
- Verwendet immer die E-Mail aus `auth.users`, nicht aus dem Formular
- Verhindert Updates, wenn E-Mail-Konflikte erkannt werden

### 3. **Profile.tsx** - Ownership-Verification
- Prüft vor jedem Update, ob das Profil dem User gehört
- Verhindert unbefugte Updates

## Monitoring

Nach der Migration kannst du die View `profile_email_mismatches` verwenden:

```sql
SELECT * FROM profile_email_mismatches;
```

Diese View zeigt alle Profile, bei denen die E-Mail nicht mit `auth.users` übereinstimmt.

## Prävention

Die neuen Trigger und Funktionen stellen sicher, dass:

1. ✅ E-Mails automatisch synchronisiert werden
2. ✅ Neue Profile immer die korrekte E-Mail aus `auth.users` erhalten
3. ✅ Updates die E-Mail nicht überschreiben können
4. ✅ Änderungen in `auth.users` automatisch zu `profiles` synchronisiert werden

## Nächste Schritte

1. ✅ Führe die Diagnose-Queries aus
2. ✅ Führe die Migration aus
3. ✅ Prüfe die Ergebnisse mit `profile_email_mismatches`
4. ✅ Teste mit einem Test-Account, ob alles funktioniert

