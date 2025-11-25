# Subscription System - Step-by-Step Implementation Plan

## Übersicht
Vollständiges System für Abonnement-Verwaltung, Feature-Freischaltung und automatische Token-Gutschrift nach erfolgreicher Zahlung.

## Schritt 1: Datenbankstruktur erweitern
- `subscriptions` Tabelle für aktive Abonnements
- `company_features` Tabelle für Feature-Status
- Spalten in `companies` für Plan-Management

## Schritt 2: Feature-Definitionen
- Feature-Mapping pro Plan (Basic, Growth, Enterprise)
- Feature-Freischaltungs-Logik

## Schritt 3: Stripe Webhook Handler (Edge Function)
- `checkout.session.completed` → Plan aktivieren
- `customer.subscription.updated` → Plan aktualisieren
- `invoice.payment_succeeded` → Features freischalten & Tokens gutschreiben

## Schritt 4: Subscription Management Functions
- `activate_subscription` - Plan aktivieren nach Zahlung
- `grant_plan_features` - Features basierend auf Plan freischalten
- `grant_monthly_tokens` - Monatliche Token-Gutschrift

## Schritt 5: Cron Job / Scheduled Function
- Monatliche/Jährliche Überprüfung der Zahlungen
- Automatische Token-Gutschrift
- Feature-Status aktualisieren

## Schritt 6: Frontend Integration
- Feature-Checks im Frontend
- Plan-Status anzeigen
- Feature-Limits durchsetzen

