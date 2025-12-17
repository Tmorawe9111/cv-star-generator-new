# 📅 Kalender-API-Integration für Interview-Planung

## 🎯 Ziel: Recruiter/HR Manager Arbeitsalltag vereinfachen

### **Kern-Features:**
1. ✅ **3 Termine auswählen** (statt 1) - Kandidat wählt einen oder macht Gegenangebot
2. ✅ **Automatische Video-Link-Generierung** (Google Meet, Teams, Zoom)
3. ✅ **Kalender-Synchronisation** (Google Calendar, Outlook, iCloud)
4. ✅ **Verfügbarkeitsprüfung** (nur freie Zeiten anbieten)
5. ✅ **Automatische Erinnerungen** (24h vorher, 1h vorher)
6. ✅ **Termin-Bestätigung** durch Kandidaten
7. ✅ **Gegenangebote** für Termine

---

## 🔌 **Empfohlene API-Integrationen (Priorität)**

### **Tier 1: Must-Have (80% der Nutzer)**
1. **Google Calendar + Google Meet** ⭐⭐⭐
   - **API**: Google Calendar API v3
   - **OAuth**: Google OAuth 2.0
   - **Features**: 
     - Automatische Event-Erstellung
     - Google Meet Link-Generierung
     - Verfügbarkeitsprüfung
   - **Kosten**: Kostenlos (bis 1M Requests/Monat)
   - **Komplexität**: Mittel

2. **Microsoft Outlook + Teams** ⭐⭐⭐
   - **API**: Microsoft Graph API
   - **OAuth**: Microsoft OAuth 2.0
   - **Features**:
     - Outlook Calendar Sync
     - Teams Meeting Link-Generierung
     - Verfügbarkeitsprüfung
   - **Kosten**: Kostenlos (bis 10K Requests/Tag)
   - **Komplexität**: Mittel-Hoch

### **Tier 2: Nice-to-Have (20% der Nutzer)**
3. **Calendly** ⭐⭐
   - **API**: Calendly API v2
   - **OAuth**: Calendly OAuth
   - **Features**:
     - Automatisches Scheduling
     - Verfügbarkeitsprüfung
     - Erinnerungen
   - **Kosten**: Ab $8/Monat (Starter Plan)
   - **Komplexität**: Niedrig (sehr gut dokumentiert)

4. **Zoom** ⭐⭐
   - **API**: Zoom API v2
   - **OAuth**: Zoom OAuth 2.0
   - **Features**:
     - Automatische Meeting-Erstellung
     - Meeting Links
   - **Kosten**: Kostenlos (bis 100 Meetings/Monat)
   - **Komplexität**: Mittel

### **Tier 3: Optional**
5. **Apple Calendar (iCloud)** ⭐
   - **API**: CalDAV (keine offizielle API)
   - **Komplexität**: Hoch (nur über CalDAV)
   - **Empfehlung**: Später, wenn Bedarf besteht

---

## 🏗️ **Architektur-Plan**

### **1. Datenbank-Erweiterungen**

```sql
-- Tabelle für Kalender-Integrationen (pro Company)
CREATE TABLE company_calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'teams', 'calendly', 'zoom')),
  access_token text NOT NULL, -- Encrypted
  refresh_token text, -- Encrypted
  expires_at timestamptz,
  calendar_id text, -- Provider-spezifische Calendar ID
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}', -- Provider-spezifische Einstellungen
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

-- Erweitere interview_requests für mehrere Termine
ALTER TABLE interview_requests 
  ADD COLUMN IF NOT EXISTS time_slots jsonb, -- Array von {start, end, status}
  ADD COLUMN IF NOT EXISTS selected_slot_index integer,
  ADD COLUMN IF NOT EXISTS video_link text, -- Google Meet, Teams, Zoom Link
  ADD COLUMN IF NOT EXISTS calendar_event_id text, -- Provider Event ID
  ADD COLUMN IF NOT EXISTS calendar_provider text; -- 'google', 'outlook', etc.

-- Tabelle für Gegenangebote
CREATE TABLE interview_time_slot_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_request_id uuid NOT NULL REFERENCES interview_requests(id) ON DELETE CASCADE,
  proposed_at timestamptz NOT NULL,
  candidate_message text,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

### **2. Supabase Edge Functions**

#### **A. OAuth-Flows (pro Provider)**
- `google-calendar-oauth` - OAuth Flow für Google
- `microsoft-calendar-oauth` - OAuth Flow für Microsoft
- `calendly-oauth` - OAuth Flow für Calendly
- `zoom-oauth` - OAuth Flow für Zoom

#### **B. Kalender-Operationen**
- `create-calendar-event` - Event in externem Kalender erstellen
- `check-availability` - Verfügbarkeit prüfen
- `generate-video-link` - Video-Link generieren (Meet/Teams/Zoom)
- `sync-calendar` - Kalender synchronisieren

### **3. Frontend-Komponenten**

#### **A. Kalender-Integration Setup**
- `CalendarIntegrationSettings.tsx` - Einstellungen für Kalender-Verbindungen
- `CalendarProviderSelector.tsx` - Provider auswählen (Google/Outlook/etc.)
- `OAuthCallback.tsx` - OAuth Callback Handler

#### **B. Interview-Planung (erweitert)**
- `ScheduleInterviewModal.tsx` - 3 Termine auswählen
- `TimeSlotSelector.tsx` - Verfügbare Zeiten anzeigen
- `VideoLinkGenerator.tsx` - Video-Link automatisch generieren
- `InterviewConfirmation.tsx` - Kandidat bestätigt Termin

#### **C. Kandidaten-Seite**
- `InterviewTimeSlotPicker.tsx` - Kandidat wählt einen von 3 Terminen
- `ProposeAlternativeTime.tsx` - Gegenangebot machen

---

## 🚀 **Implementierungs-Plan (Phasen)**

### **Phase 1: Basis-Infrastruktur (2-3 Stunden)**
1. ✅ Datenbank-Migrationen erstellen
2. ✅ `company_calendar_integrations` Tabelle
3. ✅ `interview_requests` erweitern (time_slots, video_link, etc.)
4. ✅ Frontend: Kalender-Integration Settings UI

### **Phase 2: Google Calendar Integration (3-4 Stunden)**
1. ✅ Google OAuth Setup
2. ✅ Google Calendar API Integration
3. ✅ Google Meet Link-Generierung
4. ✅ Event-Erstellung in Google Calendar
5. ✅ Verfügbarkeitsprüfung

### **Phase 3: Microsoft Outlook/Teams (3-4 Stunden)**
1. ✅ Microsoft OAuth Setup
2. ✅ Microsoft Graph API Integration
3. ✅ Teams Meeting Link-Generierung
4. ✅ Outlook Calendar Sync

### **Phase 4: 3-Termine-Feature (1-2 Stunden)**
1. ✅ UI für 3 Termine auswählen
2. ✅ Kandidat wählt einen Termin
3. ✅ Gegenangebot-Funktion
4. ✅ Status-Updates

### **Phase 5: Erweiterte Features (2-3 Stunden)**
1. ✅ Automatische Erinnerungen (24h, 1h vorher)
2. ✅ Kalender-Synchronisation (Webhooks)
3. ✅ Interview-Status nach Durchführung (passt/unpassend)

---

## 🔐 **OAuth-Flow (Beispiel: Google)**

```
1. User klickt "Google Calendar verbinden"
2. Redirect zu Google OAuth
3. User autorisiert
4. Callback mit Code
5. Edge Function tauscht Code gegen Access Token
6. Token wird verschlüsselt in DB gespeichert
7. Refresh Token für automatische Erneuerung
```

---

## 📊 **Feature-Matrix**

| Feature | Google | Outlook | Teams | Calendly | Zoom |
|---------|--------|---------|-------|----------|------|
| OAuth | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar Sync | ✅ | ✅ | ❌ | ✅ | ❌ |
| Video Link | ✅ (Meet) | ✅ (Teams) | ✅ | ❌ | ✅ |
| Availability | ✅ | ✅ | ✅ | ✅ | ❌ |
| Auto Reminders | ✅ | ✅ | ✅ | ✅ | ❌ |
| Event Creation | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## 💡 **Recruiter-Workflow (Ideal)**

1. **Kandidat freischalten** → Step 4: "Interview planen"
2. **Kalender öffnet** → Verfügbare Zeiten werden angezeigt (aus verbundenem Kalender)
3. **3 Termine auswählen** → Automatisch Video-Links generiert
4. **Anfrage senden** → Kandidat erhält Notification
5. **Kandidat wählt Termin** → Oder macht Gegenangebot
6. **Automatische Bestätigung** → Event wird in beiden Kalendern erstellt
7. **Erinnerungen** → 24h und 1h vorher automatisch
8. **Nach Interview** → Status: "Interview durchgeführt" → "Passt" oder "Unpassend"

---

## 🎯 **Nächste Schritte**

**Soll ich jetzt starten mit:**
1. ✅ Phase 1: Basis-Infrastruktur (DB + UI)
2. ✅ Phase 2: Google Calendar Integration
3. ✅ Phase 4: 3-Termine-Feature (kann parallel laufen)

**Oder bevorzugst du:**
- Erstmal nur die 3-Termine-Lösung ohne API?
- Dann später API-Integrationen hinzufügen?

