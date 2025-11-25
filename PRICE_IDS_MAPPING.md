# Price IDs Zuordnung

Du hast **9 Price IDs**. Basierend auf deinen Plänen brauchst du:

## 📊 Deine Pläne (aus plans.ts):

- **Basic**: 399€/Monat, 349€/Jahr
- **Growth**: 729€/Monat, 669€/Jahr  
- **BeVisiblle**: 1234€/Monat, 1179€/Jahr
- **BeVisiblle Pro**: 2800€/Monat, 2800€/Jahr

## 🔍 Price IDs im Stripe Dashboard prüfen

1. Gehe zu: https://dashboard.stripe.com/products
2. Für jede Price ID klicken und prüfen:
   - **Product Name** (z.B. "Basic Plan", "Growth Plan")
   - **Billing Period** (Monthly, Yearly, One-time)
   - **Amount** (z.B. 399€, 349€, 300€)

## 📋 Zuordnung (bitte ausfüllen):

### Pläne:
```
STRIPE_PRICE_BASIC_MONTH=price_xxxxx      (399€/Monat)
STRIPE_PRICE_BASIC_YEAR=price_xxxxx       (349€/Jahr)
STRIPE_PRICE_GROWTH_MONTH=price_xxxxx    (729€/Monat)
STRIPE_PRICE_GROWTH_YEAR=price_xxxxx     (669€/Jahr)
STRIPE_PRICE_BEVIS_MONTH=price_xxxxx     (1234€/Monat)
STRIPE_PRICE_BEVIS_YEAR=price_xxxxx      (1179€/Jahr)
STRIPE_PRICE_BEVIS_PRO_MONTH=price_xxxxx (2800€/Monat)
STRIPE_PRICE_BEVIS_PRO_YEAR=price_xxxxx  (2800€/Jahr)
```

### Token-Pakete:
```
STRIPE_PRICE_TOKENS_15=price_xxxxx   (15 Tokens, ~300€)
STRIPE_PRICE_TOKENS_45=price_xxxxx   (45 Tokens, ~800€)
STRIPE_PRICE_TOKENS_100=price_xxxxx  (100 Tokens, ~1500€)
```

## 🚀 Schnell-Lösung

Falls du mir sagst, welche Price ID zu welchem Plan gehört, kann ich:
1. Die Secrets direkt konfigurieren
2. Oder eine Mapping-Datei erstellen

**Oder** ich erstelle eine einfache Lösung, die alle 9 Price IDs akzeptiert und automatisch zuordnet.

