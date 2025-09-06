#!/bin/bash
# 簡易 smoke test for recommend API

set -e

echo "== Health check =="
curl -s http://localhost:3001/api/healthz | jq .

echo "== Recommend API test =="
curl -s -X POST http://localhost:3001/api/recommend \
  -H 'content-type: application/json' \
  -d '{
    "postures":["side","supine"],
    "concerns":["stiff_shoulder"],
    "pillowMaterial":["pipe"]
  }' | jq '{items:.items[0:2], final:.meta.final}'
