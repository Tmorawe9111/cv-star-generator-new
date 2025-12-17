# Phase 2: Kalender-Integration Setup

## Übersicht

Phase 2 implementiert OAuth-Integrationen für Google Calendar, Microsoft Outlook/Teams und automatische Video-Link-Generierung.

## Implementierte Features

### 1. Google Calendar OAuth
- ✅ Edge Function: `google-calendar-oauth`
- ✅ OAuth-Flow mit Callback-Handler
- ✅ Automatische Google Meet Link-Generierung
- ✅ Kalender-Event-Erstellung via Google Calendar API

### 2. Microsoft Outlook/Teams OAuth
- ✅ Edge Function: `microsoft-calendar-oauth`
- ✅ OAuth-Flow für Outlook und Teams
- ✅ Automatische Teams Meeting Link-Generierung
- ✅ Kalender-Event-Erstellung via Microsoft Graph API

### 3. Automatische Video-Link-Generierung
- ✅ Google Meet Links (via Google Calendar API)
- ✅ Teams Meeting Links (via Microsoft Graph API)
- ✅ Fallback zu manuellen Links

### 4. Calendar Integration Utilities
- ✅ `src/lib/calendar-integration.ts` mit allen Helper-Funktionen
- ✅ Calendar-Event-Erstellung via API
- ✅ URL-Generierung für verschiedene Provider

## Setup-Anleitung

### 1. Google Calendar OAuth Setup

1. **Google Cloud Console:**
   - Gehe zu https://console.cloud.google.com/
   - Erstelle ein neues Projekt oder wähle ein bestehendes
   - Aktiviere "Google Calendar API"
   - Erstelle OAuth 2.0 Credentials
   - Füge Redirect URI hinzu: `https://[YOUR_PROJECT].supabase.co/functions/v1/google-calendar-oauth/callback`

2. **Supabase Secrets:**
   ```bash
   supabase secrets set GOOGLE_CLIENT_ID=your_client_id
   supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
   supabase secrets set GOOGLE_REDIRECT_URI=https://[YOUR_PROJECT].supabase.co/functions/v1/google-calendar-oauth/callback
   ```

### 2. Microsoft Outlook/Teams OAuth Setup

1. **Azure Portal:**
   - Gehe zu https://portal.azure.com/
   - Erstelle eine neue App Registration
   - Füge Redirect URI hinzu: `https://[YOUR_PROJECT].supabase.co/functions/v1/microsoft-calendar-oauth/callback`
   - Erteile Permissions:
     - `Calendars.ReadWrite`
     - `OnlineMeetings.ReadWrite`
     - `offline_access`

2. **Supabase Secrets:**
   ```bash
   supabase secrets set MICROSOFT_CLIENT_ID=your_client_id
   supabase secrets set MICROSOFT_CLIENT_SECRET=your_client_secret
   supabase secrets set MICROSOFT_REDIRECT_URI=https://[YOUR_PROJECT].supabase.co/functions/v1/microsoft-calendar-oauth/callback
   ```

### 3. Edge Functions deployen

```bash
supabase functions deploy google-calendar-oauth
supabase functions deploy microsoft-calendar-oauth
```

## Verwendung

### Für Unternehmen:

1. **Kalender verbinden:**
   - Gehe zu `/unternehmen/einstellungen` → Tab "Kalender"
   - Klicke auf "Verbinden" bei Google Calendar, Outlook oder Teams
   - Autorisiere die App im OAuth-Flow
   - Nach erfolgreicher Verbindung wird der Kalender automatisch verwendet

2. **Interview planen:**
   - Beim Planen eines Interviews werden automatisch:
     - Kalender-Events erstellt (wenn Integration verbunden)
     - Video-Links generiert (Google Meet, Teams)
     - Termine in den Kalender eingetragen

### Für Entwickler:

```typescript
import { createCalendarEvent, CalendarProvider } from '@/lib/calendar-integration';

// Kalender-Event erstellen
const result = await createCalendarEvent(
  'google', // oder 'outlook', 'teams'
  {
    title: 'Interview mit Max Mustermann',
    description: 'Interview-Termin',
    start: new Date('2024-01-15T10:00:00'),
    end: new Date('2024-01-15T11:00:00'),
    location: 'Berlin',
  },
  accessToken
);

// result.eventId - ID des erstellten Events
// result.videoLink - Automatisch generierter Video-Link
```

## Datenbank-Struktur

Die Tabelle `company_calendar_integrations` wurde bereits in Phase 1 erstellt und speichert:
- `provider`: 'google', 'outlook', 'teams', etc.
- `access_token`: OAuth Access Token
- `refresh_token`: OAuth Refresh Token
- `expires_at`: Token-Ablaufzeit
- `calendar_id`: ID des verwendeten Kalenders
- `is_active`: Ob die Integration aktiv ist

## Nächste Schritte (Optional)

- [ ] Token-Refresh-Logik implementieren
- [ ] Calendly Integration
- [ ] Zoom Integration
- [ ] Kalender-Synchronisation (2-Way)
- [ ] Verfügbarkeitsprüfung vor Termin-Vorschlag

