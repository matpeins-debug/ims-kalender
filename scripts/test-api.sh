#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Minimale cURL-Tests gegen die laufende API.
# Voraussetzung: `npm start` läuft oder BASE_URL zeigt auf Staging.
# Nutzung: TOKEN=eyJ... BASE_URL=http://localhost:3000 bash scripts/test-api.sh
# ═══════════════════════════════════════════════════════════════

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${TOKEN:?TOKEN env-var fehlt · aus Supabase-Session holen}"

echo "════════════════════════════════════════════════"
echo "→ GET /api/health"
curl -sS "$BASE_URL/api/health" | head -c 400; echo

echo "════════════════════════════════════════════════"
echo "→ GET /api/kalender/me"
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/kalender/me" | head -c 400; echo

echo "════════════════════════════════════════════════"
echo "→ GET /api/kalender/termine (KW 17/2026)"
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/kalender/termine?von=2026-04-20&bis=2026-04-24" | head -c 2000; echo

echo "════════════════════════════════════════════════"
echo "→ POST /api/kalender/termine (Test-Termin)"
CREATED=$(curl -sS -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titel":"API-Test","start_zeit":"2026-04-25T10:00:00+02:00","end_zeit":"2026-04-25T10:30:00+02:00","kategorie":"intern"}' \
  "$BASE_URL/api/kalender/termine")
echo "$CREATED" | head -c 600; echo

TID=$(echo "$CREATED" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).data.id)}catch{console.log('')}})")
echo "Neuer Termin-ID: $TID"

if [ -n "$TID" ]; then
  echo "════════════════════════════════════════════════"
  echo "→ PATCH /api/kalender/termine/$TID"
  curl -sS -X PATCH -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"titel":"API-Test · umbenannt"}' \
    "$BASE_URL/api/kalender/termine/$TID" | head -c 400; echo

  echo "════════════════════════════════════════════════"
  echo "→ DELETE /api/kalender/termine/$TID"
  curl -sS -X DELETE -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/kalender/termine/$TID" | head -c 200; echo
fi

echo ""
echo "✔ API-Tests durch."
