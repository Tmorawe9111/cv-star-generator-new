#!/bin/bash

# Stress Test Script für BeVisiblle
# Testet die Anwendung mit bis zu 10.000 Anmeldungen

set -e

echo "🚀 BeVisiblle Stress Test"
echo "=========================="
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 ist nicht installiert."
    echo "📦 Installiere k6..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install k6
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
        sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/
    else
        echo "❌ Bitte installiere k6 manuell: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check for required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  VITE_SUPABASE_URL nicht gefunden. Verwende Standard-URL."
    export SUPABASE_URL="https://koymmvuhcxlvcuoyjnvv.supabase.co"
else
    export SUPABASE_URL="$VITE_SUPABASE_URL"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY ist erforderlich!"
    echo "Bitte setze VITE_SUPABASE_ANON_KEY in .env.local"
    exit 1
else
    export SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"
fi

echo "📊 Test-Konfiguration:"
echo "   Supabase URL: $SUPABASE_URL"
echo "   Test-Dauer: ~24 Minuten"
echo "   Max. gleichzeitige Nutzer: 1000"
echo "   Gesamt-Anmeldungen: ~10.000"
echo ""
echo "⚠️  WARNUNG: Dieser Test erstellt echte Test-Accounts in der Datenbank!"
echo "   Möchtest du fortfahren? (y/n)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Test abgebrochen."
    exit 1
fi

echo ""
echo "🧪 Starte Stress Test..."
echo ""

# Run k6 test
k6 run \
  --env SUPABASE_URL="$SUPABASE_URL" \
  --env SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  k6-signup-test.js

echo ""
echo "✅ Stress Test abgeschlossen!"
echo "📊 Ergebnisse wurden in stress-test-results.json gespeichert."

