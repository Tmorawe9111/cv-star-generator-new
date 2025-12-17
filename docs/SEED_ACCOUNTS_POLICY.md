# Seed Accounts (Bulk-Import) – Security & Consent Policy

Ziel: 500–1000 „gute“ Profile importieren, die sich **wie echte User verhalten** (posten, kommentieren, connecten), ohne unsicheres Passwort‑Sharing.

## Empfehlung (secure default)

- **Echte Auth‑Accounts** (Supabase Auth) erstellen per Service‑Role:
  - `email_confirm: true`
  - `user_metadata.is_seed = true`
  - `user_metadata.external_id = "<stable id>"` (für idempotente Imports)
- **Kein Passwort speichern/teilen**:
  - Admin öffnet den Account über **one‑time Magic Link** (Admin‑Impersonation).
  - Vorteil: kein wiederverwendetes Passwort, kein Credential‑Leak, kein Support‑Chaos.

## Admin-Impersonation Regeln

- **Nur SuperAdmin/SupportAgent** dürfen „als User öffnen“.
- Der Link sollte in **Inkognito** geöffnet werden (trennt Admin‑Session und Seed‑Session).
- Empfehlung: **Audit Log** in DB:
  - `admin_user_id`, `target_user_id`, `created_at`, optional `reason`.

## Consent / DSGVO

Du sagst: Consent liegt vor, da es „deine echten Accounts“ sind. Trotzdem als Mindeststandard:

- **Nachweisbarkeit**: pro importiertem Account ein Feld/Flag, dass Consent vorhanden ist (z.B. `profiles.data_processing_consent = true` + `consent_date`).
- **Kommunikation**: wenn die Accounts keine echte Inbox haben (ausgedachte Mails), dürfen keine automatischen E‑Mails an diese Adressen gesendet werden.
  - Dafür `is_seed` nutzen, um Email‑Automationen zu filtern.

## Was wir ausdrücklich NICHT machen sollten

- Ein **globales Standard‑Passwort** für alle Seed‑Accounts:
  - unsicher (Credential Stuffing, Leaks, Missbrauch)
  - schwer zu rotieren
  - schlecht auditierbar


