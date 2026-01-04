#!/bin/bash

# Quick Stress Test - 100 Nutzer (2 Minuten)
# Perfekt für den ersten Test!

set -e

echo "🧪 Quick Stress Test - 100 Nutzer"
echo "=================================="
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 ist nicht installiert."
    echo ""
    echo "📦 Installiere k6..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install k6
        else
            echo "❌ Homebrew nicht gefunden. Bitte installiere k6 manuell:"
            echo "   https://k6.io/docs/getting-started/installation/"
            exit 1
        fi
    else
        echo "❌ Bitte installiere k6 manuell:"
        echo "   https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
fi

echo "✅ k6 ist installiert: $(k6 version)"
echo ""

# Load environment variables from .env.local
if [ -f ../.env.local ]; then
    echo "📄 Lade Environment Variables aus .env.local..."
    export $(cat ../.env.local | grep -v '^#' | grep VITE_SUPABASE | xargs)
fi

# Check for required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  VITE_SUPABASE_URL nicht gefunden in .env.local"
    echo "   Verwende Standard-URL..."
    export SUPABASE_URL="https://koymmvuhcxlvcuoyjnvv.supabase.co"
else
    export SUPABASE_URL="$VITE_SUPABASE_URL"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY nicht gefunden!"
    echo ""
    echo "Bitte setze VITE_SUPABASE_ANON_KEY in .env.local"
    echo "Oder führe aus:"
    echo "  export SUPABASE_ANON_KEY='dein-key-hier'"
    exit 1
else
    export SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"
fi

echo "📊 Test-Konfiguration:"
echo "   Supabase URL: $SUPABASE_URL"
echo "   Test-Dauer: 2 Minuten"
echo "   Gleichzeitige Nutzer: 100"
echo "   Erwartete Anmeldungen: ~100"
echo ""
echo "⚠️  Dieser Test erstellt echte Test-Accounts in der Datenbank!"
echo "   Email-Pattern: test-*@stress-test.com"
echo ""
echo "🚀 Starte Test in 3 Sekunden..."
sleep 3

echo ""
echo "🧪 Test läuft..."
echo ""

# Run k6 test with 100 virtual users for 2 minutes
k6 run \
  --vus 100 \
  --duration 2m \
  --env SUPABASE_URL="$SUPABASE_URL" \
  --env SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  k6-signup-test.js

echo ""
echo "✅ Quick Test abgeschlossen!"
echo ""
echo "📊 Nächste Schritte:"
echo "   1. Prüfe die Ergebnisse oben"
echo "   2. Prüfe Supabase Dashboard > Auth > Users"
echo "   3. Wenn erfolgreich, führe den vollständigen Test aus:"
echo "      ./run-stress-test.sh"
echo ""
echo "🧹 Cleanup:"
echo "   Führe cleanup-test-users.sql im Supabase SQL Editor aus"

