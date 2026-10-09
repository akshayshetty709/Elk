#!/usr/bin/env bash
set -eu
BASE_URL="${1:-http://localhost:3000}"

echo "Sending successful requests..."
for i in $(seq 1 10); do
  curl -sS -H "X-Request-ID: success-$i" "$BASE_URL/" >/dev/null
done

echo "Sending not-found requests..."
for i in $(seq 1 3); do
  curl -sS -H "X-Request-ID: notfound-$i" "$BASE_URL/missing-$i" >/dev/null
done

echo "Sending one simulated failure (expected HTTP 500)..."
status=$(curl -sS -o /tmp/elk-practice-error.json -w '%{http_code}' \
  -H "X-Request-ID: simulated-failure-001" "$BASE_URL/fail")
cat /tmp/elk-practice-error.json
echo
echo "Failure endpoint returned HTTP $status (expected 500)."
