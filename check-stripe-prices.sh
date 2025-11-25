#!/bin/bash

# Script to check Stripe Price IDs
# Requires: curl and jq (install with: brew install jq)

STRIPE_SECRET_KEY="sk_test_51SUSWXEn7Iw8aL2bRSt92aCoy2y55NaJbssxoRBc0t8rui2xOsAcA5kuFXZVmP1FnwVO9d0ccWuWP9bYQzrgzuiS00qj3lcvse"
PRICE_ID="price_1SUSgMEn7Iw8aL2btlnugoGX"

echo "🔍 Prüfe Price ID: $PRICE_ID"
echo "=================================="

# Check if price exists
RESPONSE=$(curl -s -u "$STRIPE_SECRET_KEY:" \
  "https://api.stripe.com/v1/prices/$PRICE_ID")

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Price ID existiert NICHT oder ist nicht zugänglich"
  echo "$RESPONSE" | jq '.error'
else
  echo "✅ Price ID existiert:"
  echo "$RESPONSE" | jq '{id: .id, active: .active, amount: .unit_amount, currency: .currency, interval: .recurring.interval, product: .product}'
fi

echo ""
echo "📋 Alle aktiven Prices in Stripe:"
echo "=================================="

# List all prices
curl -s -u "$STRIPE_SECRET_KEY:" \
  "https://api.stripe.com/v1/prices?limit=100&active=true" | \
  jq '.data[] | {id: .id, amount: .unit_amount, currency: .currency, interval: .recurring.interval, product: .product}'

