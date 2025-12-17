# Bulk Uploads (Unternehmen, Standorte, Stellenanzeigen, Nutzerprofile)

Dieses Dokument beschreibt ein **robustes, wiederholbares** Bulk‑Import‑Setup per CSV/Excel (Export → Import), ohne dass Daten „doppelt“ entstehen.

## Grundprinzipien

- **Idempotent**: Jeder Datensatz hat einen stabilen Schlüssel (`external_id`). Ein erneuter Import macht ein **Upsert** (update/insert), kein Duplizieren.
- **Getrennte Dateien** (oder Excel‑Tabs): `companies`, `company_locations`, `job_posts`, optional `job_contacts`, `users`.
- **Referenzen über externe Keys**: Jobs referenzieren Company/Location/Kontakt per `company_external_id`, `location_external_id`, `contact_email`.
- **Kompatibel zum aktuellen Schema**:
  - Jobs (`public.job_posts`) haben bereits `external_id` + Kontaktfelder (`contact_person_*`) + Adressfelder (city/postal_code/address_*).
  - Standorte (`public.company_locations`) sind vorhanden.
  - Ein „Job hat mehrere Standorte“ ist aktuell **nicht** als Join‑Tabelle modelliert. Für Bulk‑Upload nutzen wir daher:
    - **ein Primary‑Standort pro Job**, über den wir die Adressfelder im `job_posts` füllen.
    - Optional später: `job_post_locations` Join‑Table (wenn ihr echte Multi‑Locations pro Job im UI braucht).

## 1) Unternehmen Import

### Datei: `companies.csv`
Pflichtfelder:
- `company_external_id` (eindeutig, stabil)
- `name`

Empfohlen:
- `primary_email` (Owner/Support‑Recovery, Domain‑Regeln)
- `industry`
- `website_url`
- `description`

Mapping (Beispiele):
- `companies.primary_email` ← `primary_email`
- `companies.name` ← `name`
- `companies.industry` ← `industry`
- `companies.website_url` ← `website_url`

### Datei: `company_locations.csv`
Pflichtfelder:
- `company_external_id`
- `location_external_id` (eindeutig pro Firma)
- `city`

Empfohlen:
- `name` (z.B. „Zentrale“, „Standort Berlin“)
- `street`, `house_number`, `postal_code`, `country`
- `is_primary` (true/false)

Mapping:
- `company_locations.company_id` wird über `company_external_id` aufgelöst
- `company_locations.city` ← `city`
- `company_locations.is_primary` ← `is_primary`

## 2) Stellenanzeigen Import

### Datei: `job_posts.csv`
Pflichtfelder:
- `company_external_id`
- `job_external_id` (→ `job_posts.external_id`, eindeutig pro Firma/Quelle)
- `title`
- `is_active` (true/false)

Empfohlen:
- `description_md`, `tasks_md`, `requirements_md`
- **Standort‑Link**: `location_external_id` (damit Job Adresse aus `company_locations` übernimmt)
- **Kontakt‑Link**: `contact_email` (wenn das ein Team‑Mitglied ist, übernehmen wir Name/Telefon/Foto automatisch)

Mapping:
- `job_posts.company_id` wird über `company_external_id` aufgelöst
- `job_posts.external_id` ← `job_external_id`
- `job_posts.title` ← `title`
- `job_posts.is_active` ← `is_active`
- `job_posts.description_md` ← `description_md`
- `job_posts.tasks_md` ← `tasks_md`
- `job_posts.requirements_md` ← `requirements_md`
- `job_posts.contact_person_email` ← `contact_email` (und wenn vorhanden: Name/Phone/Role/Photo)
- Standort:
  - wenn `location_external_id` vorhanden:
    - finde `company_locations` → kopiere in `job_posts.city`, `job_posts.postal_code`, `job_posts.address_street`, `job_posts.address_number`, `job_posts.country`, optional `location_lat/lng`
  - sonst nutze direkte Adressspalten aus CSV (city/postal_code/street/number)

## 3) Nutzerprofile (Talente) Bulk Upload

Hier gibt es **zwei Modi** (bitte entscheiden, was ihr wollt):

### Modus A (empfohlen für echte Menschen): „Profile importieren + User wird eingeladen“
- Wir importieren Profildaten in `public.profiles` **nur wenn** es einen Auth‑User gibt.
- Erzeugung der Auth‑User passiert via Admin‑Flow:
  - **Invite / Magic Link** (kein Passwort speichern)
  - Der/die Nutzer:in setzt selbst Passwort und kann posten/connecten.

### Modus B (Seed‑Marketplace, aber mit „echten Aktionen“ wie posten/connecten)
Wenn du mit diesen Profilen **posten/kommentieren/freunde annehmen** willst, brauchen sie technisch **einen echten Auth‑Account** (sonst gibt es keine `auth.uid()` für Posts/Connections).

Sicher & praktikabel (ohne Passwörter zu speichern/teilen):
- Wir erstellen die Seed‑Accounts per Service‑Role (`auth.admin.createUser`) mit:
  - `email_confirm: true` (damit kein Mail‑Flow nötig ist)
  - `user_metadata.is_seed = true` + `user_metadata.external_id`
- Wir erzeugen/aktualisieren `public.profiles` für diese User (mit allen Daten, CV‑URL, Avatar etc.).
- **Login als Seed‑User** läuft über **Admin‑Magic‑Link** (one‑time):
  - Ihr habt dafür bereits eine Edge Function: `supabase/functions/admin-user-actions` mit `action=impersonate` → liefert `action_link` zurück (ohne E‑Mail Versand).
  - Empfehlung: Link in **Inkognito/anderem Browserprofil** öffnen, damit dein Admin‑Login nicht überschrieben wird.

### Modus C (nur für interne Tests): „Demo‑Accounts mit Login“
- Wir erstellen Auth‑User automatisiert (Service‑Role), aber:
  - keine echten Personen/Emails ohne Consent
  - am besten **eigene Test‑Domain** (z.B. `@demo.bevisible.app`)
  - Login entweder per Invite‑Link oder per Passwort‑Reset‑Link (kein Passwort im System speichern).

## Consent/Policy (wichtig)
- Importierte Accounts sollten als **`is_seed`** markiert werden, damit:
  - kein versehentliches Marketing/Email‑Automation greift
  - Admin‑Impersonation klar ersichtlich ist
- Admin‑„als User öffnen“ nur für **SuperAdmin/Support** und idealerweise **mit Audit‑Log** (wer wann wen geöffnet hat).

## Offene Entscheidungen (bitte kurz beantworten)

1) **Wie viele Datensätze** typischerweise? (100 / 1.000 / 10.000)
2) Bei Jobs: Reicht **ein Standort pro Job** (Primary) oder braucht ihr echte Multi‑Locations pro Job im UI?
3) Nutzerprofile: Wollt ihr **echte Logins** (Invite/Magic Link) oder **nur Seed‑Profile**?
4) Habt ihr für importierte Nutzerprofile eine **Einwilligung/Consent** (DSGVO)?


