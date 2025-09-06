#!/usr/bin/env bash
set -euo pipefail

assert_not_null() {  # $1: JSON, $2: jq path, $3: message
  local val
  val=$(echo "$1" | jq -r "$2")
  if [ "$val" = "null" ] || [ -z "$val" ]; then
    echo "❌ FAIL: $3 → null/empty"
    exit 1
  else
    echo "✅ PASS: $3 → $val"
  fi
}

echo "==> wait & healthz"
sleep 8
curl -s http://localhost:3001/api/healthz | jq .

echo "==> Case A (postures)"
RES_A=$(curl -s -X POST http://localhost:3001/api/recommend -H 'content-type: application/json' -d '{"postures":["side","supine"],"concerns":[],"pillowMaterial":[]}')
assert_not_null "$RES_A" '.meta.final.primaryGroup[0]' "A: primaryGroup"
assert_not_null "$RES_A" '.meta.final.secondaryGroup[0]' "A: secondaryGroup"
assert_not_null "$RES_A" '.items[0].id' "A: items[0].id"

echo "==> Case B (concerns)"
RES_B=$(curl -s -X POST http://localhost:3001/api/recommend -H 'content-type: application/json' -d '{"postures":[],"concerns":["stiff_shoulder","poor_turnover"],"pillowMaterial":[]}')
assert_not_null "$RES_B" '.meta.final.primaryGroup[0]' "B: primaryGroup"
assert_not_null "$RES_B" '.meta.final.secondaryGroup[0]' "B: secondaryGroup"
assert_not_null "$RES_B" '.items[0].id' "B: items[0].id"

echo "==> Case C (material)"
RES_C=$(curl -s -X POST http://localhost:3001/api/recommend -H 'content-type: application/json' -d '{"postures":[],"concerns":[],"pillowMaterial":["pipe"]}')
assert_not_null "$RES_C" '.meta.final.primaryGroup[0]' "C: primaryGroup"
assert_not_null "$RES_C" '.meta.final.secondaryGroup[0]' "C: secondaryGroup"
assert_not_null "$RES_C" '.items[0].id' "C: items[0].id"

echo "==> Case D (empty -> fallback)"
RES_D=$(curl -s -X POST http://localhost:3001/api/recommend -H 'content-type: application/json' -d '{"postures":[],"concerns":[],"pillowMaterial":[]}')
assert_not_null "$RES_D" '.meta.final.primaryGroup[0]' "D: primaryGroup"
assert_not_null "$RES_D" '.meta.final.secondaryGroup[0]' "D: secondaryGroup"
assert_not_null "$RES_D" '.items[0].id' "D: items[0].id"

echo "🎉 ALL GREEN"
