#!/bin/bash

# Stripe Edge Functions Deployment Script
# Führe dieses Script aus, um beide Functions zu deployen

echo "🚀 Deploye Stripe Edge Functions..."
echo ""

# Prüfe ob eingeloggt
echo "📋 Prüfe Supabase Login..."
if ! supabase projects list &>/dev/null; then
    echo "❌ Nicht eingeloggt. Bitte zuerst einloggen:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Eingeloggt"
echo ""

# Prüfe ob Projekt verlinkt
echo "📋 Prüfe Projekt-Link..."
if ! grep -q "project_id" supabase/config.toml 2>/dev/null; then
    echo "⚠️  Projekt nicht verlinkt. Verlinke jetzt..."
    supabase link --project-ref koymmvuhcxlvcuoyjnvv
else
    echo "✅ Projekt verlinkt"
fi
echo ""

# Deploye Functions
echo "🚀 Deploye stripe-checkout..."
supabase functions deploy stripe-checkout

if [ $? -eq 0 ]; then
    echo "✅ stripe-checkout deployed"
else
    echo "❌ Fehler beim Deployen von stripe-checkout"
    exit 1
fi

echo ""
echo "🚀 Deploye stripe-token-checkout..."
supabase functions deploy stripe-token-checkout

if [ $? -eq 0 ]; then
    echo "✅ stripe-token-checkout deployed"
else
    echo "❌ Fehler beim Deployen von stripe-token-checkout"
    exit 1
fi

echo ""
echo "🎉 Beide Functions erfolgreich deployed!"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Prüfe Secrets in Supabase Dashboard (STRIPE_SECRET_KEY)"
echo "   2. Konfiguriere Stripe Price IDs (optional)"
echo "   3. Teste die Functions"
echo ""

