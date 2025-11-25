# ✅ Stripe Secrets - Finale Konfiguration

## 📋 Alle Price IDs die du hast:

**Token-Pakete (3):**
- 50 Tokens: `price_1SUSkbEn7Iw8aL2bWSfxgfeV`
- 150 Tokens: `price_1SUSl8En7Iw8aL2bQhWLdho3`
- 300 Tokens: `price_1SUSoJEn7Iw8aL2bIeX7QI8b`

**Pläne (6 verbleibende):**
- `price_1SUSitEn7Iw8aL2bDOnV7zfX`
- `price_1SUSitEn7Iw8aL2bRrOEW7EJ`
- `price_1SUShuEn7Iw8aL2bjTAtU4iQ`
- `price_1SUShuEn7Iw8aL2b1VLd5bzm`
- `price_1SUSgMEn7Iw8aL2btlnugoGX`
- `price_1SUSgMEn7Iw8aL2bZYRflgKI`

## 🔧 Secrets in Supabase konfigurieren

Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets

### Token-Pakete (3 Secrets):
```
STRIPE_PRICE_TOKENS_50 = price_1SUSkbEn7Iw8aL2bWSfxgfeV
STRIPE_PRICE_TOKENS_150 = price_1SUSl8En7Iw8aL2bQhWLdho3
STRIPE_PRICE_TOKENS_300 = price_1SUSoJEn7Iw8aL2bIeX7QI8b
```

### Pläne (8 Secrets - du hast 6, fehlen 2):

**Bitte im Stripe Dashboard prüfen, welche Price ID zu welchem Plan gehört:**

1. Gehe zu: https://dashboard.stripe.com/products
2. Klicke auf jede Price ID
3. Prüfe:
   - **Product Name** (Basic, Growth, BeVis, BeVis Pro)
   - **Amount** (399€, 729€, 1234€, 2800€)
   - **Billing Period** (Monthly, Yearly)

**Dann füge hinzu:**
```
STRIPE_PRICE_BASIC_MONTH = price_xxxxx (399€/Monat)
STRIPE_PRICE_BASIC_YEAR = price_xxxxx (349€/Jahr)
STRIPE_PRICE_GROWTH_MONTH = price_xxxxx (729€/Monat)
STRIPE_PRICE_GROWTH_YEAR = price_xxxxx (669€/Jahr)
STRIPE_PRICE_BEVIS_MONTH = price_xxxxx (1234€/Monat)
STRIPE_PRICE_BEVIS_YEAR = price_xxxxx (1179€/Jahr)
STRIPE_PRICE_BEVIS_PRO_MONTH = price_xxxxx (2800€/Monat)
STRIPE_PRICE_BEVIS_PRO_YEAR = price_xxxxx (2800€/Jahr)
```

## ⚠️ Wichtig

Die Token-Pakete sind jetzt **hardcoded** in den Functions (als Fallback). 
Falls du die Secrets setzt, werden diese verwendet. Falls nicht, werden die hardcoded IDs verwendet.

## 🧪 Testen

Nach dem Konfigurieren:
1. **Token-Kauf testen**: `/company/billing-v2` → "Tokens kaufen"
2. **Plan-Kauf testen**: Onboarding oder `/company/billing-v2` → "Plan upgraden"

Die Token-Pakete sollten jetzt funktionieren! 🎉

