# 🚀 Quick Fix: Price IDs konfigurieren

## Option 1: Alle Price IDs als Secrets hinzufügen (empfohlen)

Gehe zu: https://supabase.com/dashboard/project/koymmvuhcxlvcuoyjnvv/settings/secrets

Füge alle Price IDs hinzu (auch wenn du nicht weißt, welche zu welchem Plan gehört):

```
STRIPE_PRICE_BASIC_MONTH=price_1SUSoJEn7Iw8aL2bIeX7QI8b
STRIPE_PRICE_BASIC_YEAR=price_1SUSl8En7Iw8aL2bQhWLdho3
STRIPE_PRICE_GROWTH_MONTH=price_1SUSkbEn7Iw8aL2bWSfxgfeV
STRIPE_PRICE_GROWTH_YEAR=price_1SUSitEn7Iw8aL2bDOnV7zfX
STRIPE_PRICE_BEVIS_MONTH=price_1SUSitEn7Iw8aL2bRrOEW7EJ
STRIPE_PRICE_BEVIS_YEAR=price_1SUShuEn7Iw8aL2bjTAtU4iQ
STRIPE_PRICE_BEVIS_PRO_MONTH=price_1SUShuEn7Iw8aL2b1VLd5bzm
STRIPE_PRICE_BEVIS_PRO_YEAR=price_1SUSgMEn7Iw8aL2btlnugoGX
STRIPE_PRICE_TOKENS_15=price_1SUSgMEn7Iw8aL2bZYRflgKI
STRIPE_PRICE_TOKENS_45=price_xxxxx
STRIPE_PRICE_TOKENS_100=price_xxxxx
```

**Hinweis:** Die Zuordnung ist vorerst willkürlich. Du kannst sie später korrigieren, wenn du weißt, welche zu welchem Plan gehört.

## Option 2: Automatische Zuordnung (ich passe die Functions an)

Ich kann die Functions so anpassen, dass sie:
1. Alle Price IDs aus Stripe abrufen
2. Automatisch zuordnen basierend auf Preis/Betrag
3. Oder eine einfache Liste akzeptieren

**Welche Option bevorzugst du?**

