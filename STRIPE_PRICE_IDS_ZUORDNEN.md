# Stripe Price IDs zuordnen

Du hast **9 Price IDs**. Wir brauchen:

- **8 Price IDs für Pläne** (4 Pläne × 2 Intervalle):
  - Basic: month + year
  - Growth: month + year
  - BeVis: month + year
  - BeVis Pro: month + year

- **3 Price IDs für Token-Pakete**:
  - 15 Tokens
  - 45 Tokens
  - 100 Tokens

**Total: 11 Price IDs benötigt, du hast 9**

## 🔍 Price IDs im Stripe Dashboard prüfen

1. Gehe zu: https://dashboard.stripe.com/products
2. Für jede Price ID:
   - Klicke auf das Product
   - Scrolle zu "Pricing"
   - Klicke auf die Price ID
   - Siehst du:
     - **Product Name** (z.B. "Basic Plan", "Growth Plan", "Token Pack")
     - **Billing Period** (Monthly, Yearly, One-time)
     - **Amount** (z.B. 29€, 290€, 15 Tokens)

## 📋 Zuordnung

Trage hier ein, welche Price ID zu welchem Plan/Paket gehört:

### Pläne:
- Basic Monthly: `price_xxxxx`
- Basic Yearly: `price_xxxxx`
- Growth Monthly: `price_xxxxx`
- Growth Yearly: `price_xxxxx`
- BeVis Monthly: `price_xxxxx`
- BeVis Yearly: `price_xxxxx`
- BeVis Pro Monthly: `price_xxxxx`
- BeVis Pro Yearly: `price_xxxxx`

### Token-Pakete:
- 15 Tokens: `price_xxxxx`
- 45 Tokens: `price_xxxxx`
- 100 Tokens: `price_xxxxx`

## 🚀 Alternative: Automatische Zuordnung

Falls du mir sagst, welche Price IDs zu welchen Plänen gehören, kann ich:
1. Die Secrets direkt konfigurieren
2. Oder die Functions anpassen, um flexibler zu sein

