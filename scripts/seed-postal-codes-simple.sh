#!/bin/bash
# Simple script to seed postal codes using curl and the Edge Function
# This works around the Dashboard invoke issue

SUPABASE_URL="https://koymmvuhcxlvcuoyjnvv.supabase.co"
SEED_TOKEN="e2d69ab684396bbfeac29eb6a3b333977d804b0d1e8c713122de8e79957bf688"

echo "🚀 Calling seed-all-postal-codes Edge Function..."
echo ""

# First, try with x-seed-token header
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/seed-all-postal-codes" \
  -H 'Content-Type: application/json' \
  -H "x-seed-token: ${SEED_TOKEN}" \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveW1tdnVoY3hsdmN1b3lqbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODA3NTcsImV4cCI6MjA2OTk1Njc1N30.Pb5uz3xFH2Fupk9JSjcbxNrS-s_mE3ySnFy5B7HcZFw' \
  -d '{"dry_run": false, "batch_size": 500}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"



