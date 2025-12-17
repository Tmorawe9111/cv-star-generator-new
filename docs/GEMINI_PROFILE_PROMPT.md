# Gemini Prompt: Vollständige Seed‑Profile (Import-ready)

Ziel: 500–1000 **vollständige** Profile für Marketplace/Community erzeugen, die direkt importierbar sind.

## Wichtig (damit es im System funktioniert)

- **Echte Aktionen (posten, kommentieren, connecten)** erfordern **echte Auth‑Accounts**.
- Für Seed‑Imports nutzen wir invented Emails – aber:
  - **nur PRIVATE Domains** (wegen eurer Policy): `gmail.com`, `web.de`, `gmx.de`, `outlook.com`, `icloud.com`, …
  - keine Firmen-Domains (`@firma.de`) – die würden eure Profile‑Policy blocken.
- Import erwartet **JSON Array** (50 Profile pro Batch empfohlen).
- Pflichtfelder für „complete“:
  - `user_external_id`, `email`, `first_name`, `last_name`
  - `branche`, `status`
  - `location_city`, `location_postal_code`
  - `headline`, `bio`
  - `profile_published: true`

## Empfohlene Wertebereiche

- `status`: `schueler` | `azubi` | `ausgelernt`
- `branche`: `pflege` | `handwerk` | `industrie` | `buero` | `verkauf` | `gastronomie` | `bau`
- Telefon: deutsches Format `+49 …`
- PLZ: 5-stellig, passende Stadt in Deutschland

## Prompt (Copy/Paste)

```text
Du bist ein Daten-Generator für Seed-Profile (Deutschland). Erzeuge ein JSON-ARRAY mit exakt dem Schema unten, ohne zusätzliche Keys. Die Profile müssen realistisch, vielfältig und vollständig sein.

WICHTIG:
- email muss eine PRIVATE Domain haben: gmail.com, web.de, gmx.de, outlook.com, icloud.com (keine Firmen-Domains!)
- user_external_id eindeutig (z.B. seed-0001..)
- status ist eines von: schueler | azubi | ausgelernt
- branche ist eines von: pflege | handwerk | industrie | buero | verkauf | gastronomie | bau
- location_postal_code ist 5-stellig, location_city in DE
- headline max 80 Zeichen
- bio 3-6 Sätze, deutsch, ohne Platzhalter, ohne Lorem Ipsum
- consent ist vorhanden (echte Accounts), aber keine Marketing-Claims erfinden

JSON Schema (exakt so):
[
  {
    "user_external_id": "seed-0001",
    "email": "bevisible.seed+0001@gmail.com",
    "first_name": "…",
    "last_name": "…",
    "telefon": "+49 …",
    "headline": "…",
    "bio": "…",
    "branche": "pflege",
    "status": "ausgelernt",
    "location_city": "Berlin",
    "location_postal_code": "10115",
    "cv_url": null,
    "avatar_url": null,
    "profile_published": true,

    "uebermich": "… (optional, länger)",
    "kenntnisse": "… (optional)",
    "motivation": "… (optional)",
    "praktische_erfahrung": "… (optional)",

    "sprachen": ["Deutsch (C1)", "Englisch (B1)"],
    "faehigkeiten": ["Teamarbeit", "Empathie", "Dokumentation"],
    "schulbildung": [{"abschluss":"…","schule":"…","ort":"…","jahr":"…"}],
    "berufserfahrung": [{"rolle":"…","arbeitgeber":"…","ort":"…","von":"YYYY-MM","bis":"YYYY-MM oder null","beschreibung":"…"}]
  }
]

Erzeuge 50 Profile pro Antwort.
```

## Import-Flow (im Admin Panel)

1. `/admin/bulk-import` öffnen → Tab **Seed-Profile**
2. Gemini JSON einfügen → **JSON laden**
3. **DryRun (Backend)** → Fehler fixen
4. **Import** → erstellt Auth‑User + füllt `profiles`


