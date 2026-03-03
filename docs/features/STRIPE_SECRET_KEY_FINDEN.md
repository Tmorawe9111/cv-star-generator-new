# Stripe Secret Key finden - Anleitung

## 🔑 Wo finde ich meinen Stripe Secret Key?

### Schritt 1: Stripe Dashboard öffnen

1. Gehe zu: https://dashboard.stripe.com
2. Logge dich mit deinem Stripe-Account ein

### Schritt 2: API Keys öffnen

1. Klicke auf **Developers** (oben rechts in der Navigation)
2. Klicke auf **API keys** (linke Sidebar)

### Schritt 3: Secret Key finden

Du siehst zwei Keys:

#### 🔴 Secret key (für Backend/Server)
- Beginnt mit `sk_test_...` (Test-Modus)
- Oder `sk_live_...` (Production)
- **Das ist der Key, den du brauchst!**

#### 🟢 Publishable key (für Frontend)
- Beginnt mit `pk_test_...` oder `pk_live_...`
- Wird im Frontend verwendet (nicht für Edge Functions)

### Schritt 4: Secret Key kopieren

1. Klicke auf **Reveal test key** (oder **Reveal live key** für Production)
2. Kopiere den kompletten Key (z.B. `sk_test_51AbC123...`)
3. **Wichtig**: Dieser Key gibt volle Kontrolle über dein Stripe-Konto - teile ihn niemals öffentlich!

## 🧪 Test vs. Live Keys

### Test-Modus (für Entwicklung)
- **Secret key**: `sk_test_...`
- **Publishable key**: `pk_test_...`
- **Verwendung**: Für Tests und Entwicklung
- **Zahlungen**: Werden nicht wirklich abgebucht

### Live-Modus (für Production)
- **Secret key**: `sk_live_...`
- **Publishable key**: `pk_live_...`
- **Verwendung**: Für echte Kunden
- **Zahlungen**: Werden wirklich abgebucht

## 📋 Für dein Deployment

**Für jetzt (Test/Entwicklung):**
```
STRIPE_SECRET_KEY=sk_test_51AbC123...
```

**Später (Production):**
```
STRIPE_SECRET_KEY=sk_live_51XyZ789...
```

## ⚠️ Wichtig

- **Niemals** den Secret Key im Frontend-Code verwenden
- **Niemals** den Secret Key in Git committen
- **Nur** in Supabase Secrets oder Umgebungsvariablen speichern
- **Test-Keys** beginnen mit `sk_test_`
- **Live-Keys** beginnen mit `sk_live_`

## 🔒 Sicherheit

Falls du den Key versehentlich geteilt hast:
1. Gehe zu Stripe Dashboard → API keys
2. Klicke auf **Roll key** (Key neu generieren)
3. Alte Keys werden sofort deaktiviert

## ✅ Nächster Schritt

Nachdem du den Key kopiert hast:
1. Gehe zu Supabase Dashboard → Edge Functions → Secrets
2. Füge `STRIPE_SECRET_KEY` mit deinem kopierten Key hinzu
3. Oder verwende: `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`

