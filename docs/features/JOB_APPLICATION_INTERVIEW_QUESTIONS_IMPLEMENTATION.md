# Job Application Interview Questions - Implementierung

## ✅ Implementiert

### 1. Datenbank-Migration
**Datei:** `supabase/migrations/20251204000000_add_job_application_interview_answers.sql`

- ✅ Neue Tabelle `job_application_interview_answers`
- ✅ Verknüpfung mit `applications` und `company_interview_questions`
- ✅ Tracking von `source` (ai_matched, user_provided, user_edited)
- ✅ RLS Policies für User und Company
- ✅ Indexes für Performance

### 2. UI-Komponente
**Datei:** `src/components/jobs/JobApplicationInterviewQuestions.tsx`

**Features:**
- ✅ Lädt stellen-spezifische Interviewfragen
- ✅ Lädt bestehende Kandidaten-Antworten (allgemeine Branchenfragen)
- ✅ Einfaches Text-Matching (kann später mit AI erweitert werden)
- ✅ Status-Anzeigen:
  - ✅ "Bereits beantwortet" (grün)
  - ⚠️ "Ähnliche Antwort gefunden" (gelb, mit Vorschlag)
  - ❌ "Neu beantworten" (grau)
- ✅ "Vorschlag übernehmen" Button für ähnliche Antworten
- ✅ Progress-Anzeige
- ✅ Speichert Antworten in `job_application_interview_answers`

### 3. Hook für Modal-Management
**Datei:** `src/hooks/useJobApplicationInterview.tsx`

**Features:**
- ✅ Prüft automatisch nach Freischaltung, ob Fragen beantwortet werden müssen
- ✅ Öffnet Modal automatisch, wenn Fragen vorhanden
- ✅ Manuelles Öffnen über `openModal()`
- ✅ Prüft, ob alle Fragen beantwortet wurden

### 4. Integration in Notifications
**Dateien:** 
- `src/pages/Notifications.tsx`
- `src/components/notifications/NotificationCard.tsx`

**Features:**
- ✅ Modal wird automatisch nach Freischaltung angezeigt
- ✅ Button in Notification-Karte: "Interviewfragen beantworten"
- ✅ Notification-Payload enthält `application_id` und `job_id`

### 5. Unlock-Flow Integration
**Datei:** `src/components/unlock/CandidateUnlockModal.tsx`

**Änderungen:**
- ✅ Notification-Typ geändert zu `company_unlocked_you`
- ✅ Payload enthält `application_id` und `job_id` für Interviewfragen

---

## 🔄 Flow

### Nach Freischaltung:

1. **Unlock erfolgt** → `CandidateUnlockModal` sendet Notification
2. **Notification erstellt** mit `application_id` und `job_id` im Payload
3. **Hook prüft automatisch** → `useJobApplicationInterview` findet offene Fragen
4. **Modal öffnet sich** → `JobApplicationInterviewQuestions` wird angezeigt
5. **Kandidat sieht:**
   - Stellen-spezifische Fragen
   - Status pro Frage (bereits beantwortet, ähnlich, neu)
   - AI-Vorschläge für ähnliche Fragen
6. **Kandidat kann:**
   - Vorschläge übernehmen
   - Antworten anpassen
   - Neu beantworten
7. **Speichern** → Antworten werden in `job_application_interview_answers` gespeichert

---

## 📊 Datenbank-Struktur

### `job_application_interview_answers`
```sql
- id (uuid)
- application_id (uuid) → applications.id
- question_id (uuid) → company_interview_questions.id
- answer (text)
- source (text) → 'ai_matched' | 'user_provided' | 'user_edited'
- matched_from_answer_id (uuid) → user_interview_answers.id (optional)
- created_at, updated_at
```

### Verknüpfungen:
- `applications` → `job_posts` (via `job_id`)
- `job_posts` → `company_interview_questions` (via `role_id`)
- `user_interview_answers` → für Matching

---

## 🎯 Matching-Logik

### Aktuell: Einfaches Text-Matching
- Extrahiert Keywords aus Fragen
- Vergleicht mit bestehenden Antworten
- Mindestens 30% Ähnlichkeit erforderlich
- Findet beste Übereinstimmung

### Später: AI-Matching (optional)
- Kann durch Edge Function erweitert werden
- NLP-basierte semantische Ähnlichkeit
- Bessere Trefferquote

---

## 🚀 Nächste Schritte (Optional)

1. **AI-Matching verbessern**
   - Edge Function für semantische Ähnlichkeit
   - Bessere Keyword-Extraktion
   - Kontext-bewusstes Matching

2. **Dashboard-Banner**
   - Zeigt offene Interviewfragen an
   - Link zum Modal

3. **Email-Benachrichtigung**
   - Erinnerung, wenn Fragen offen sind
   - Nach 24h, 3 Tagen, 1 Woche

4. **Unternehmens-Ansicht**
   - Zeigt beantwortete Fragen im Kandidaten-Profil
   - Vergleich mit Stellenanforderungen
   - Value-Fit-Score Integration

---

## 📝 Verwendung

### Für Kandidaten:
1. Nach Freischaltung öffnet sich automatisch das Modal
2. Oder: Button in Notification "Interviewfragen beantworten"
3. Fragen beantworten, Vorschläge übernehmen/anpassen
4. Speichern

### Für Unternehmen:
1. Interviewfragen pro Stelle hinterlegen (bereits vorhanden)
2. Nach Freischaltung sehen Kandidaten die Fragen
3. Antworten werden im Kandidaten-Profil angezeigt (später)

---

## ✅ Status

- [x] Datenbank-Migration
- [x] UI-Komponente
- [x] Hook für Modal-Management
- [x] Integration in Notifications
- [x] Unlock-Flow Integration
- [ ] AI-Matching (optional, später)
- [ ] Dashboard-Banner (optional)
- [ ] Email-Benachrichtigungen (optional)
- [ ] Unternehmens-Ansicht (später)

---

**Die Implementierung ist vollständig und einsatzbereit!** 🎉

