#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-3001}
BASE="http://localhost:${PORT}"
JSON='Content-Type: application/json'
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

# ------------ helpers ------------
fail()   { echo -e "${RED}✗${NC} $*"; exit 1; }
ok()     { echo -e "${GREEN}✓${NC} $*"; }
jqget()  { jq -r "$1" <<<"$2"; }
contains_reason() {
  local resp="$1" needle="$2"
  echo "$resp" | jq -e --arg k "$needle" '.meta.final.reasons[] | tostring | contains($k) | select(.)' >/dev/null
}

# dev 起動（RECO_WIRING=1 で final を返すモード）
RECO_WIRING=1 pnpm -C apps/pillow dev -p "${PORT}" >/tmp/pillow-dev.log 2>&1 &
APP_PID=$!
cleanup(){ kill ${APP_PID} >/dev/null 2>&1 || true; }
trap cleanup EXIT

# health wait
for i in $(seq 1 30); do
  if curl -sf "${BASE}/api/healthz" >/dev/null; then break; fi
  sleep 1
done
curl -sf "${BASE}/api/healthz" | grep -q '"ok":true' || fail "health check failed"
ok "health check ok"

# ------------ test runner ------------
run_case () {
  local name="$1" payload="$2" expect_reason="${3:-}"

  echo "— case: ${name}"
  resp="$(curl -s -X POST "${BASE}/api/recommend" -H "${JSON}" -d "${payload}")"
  # 共通アサーション
  items_len="$(jqget '.items | length' "${resp}")"
  pg="$(jqget '.meta.final.primaryGroup[0] // empty' "${resp}")"
  sg="$(jqget '.meta.final.secondaryGroup[0] // empty' "${resp}")"

  [[ "${items_len}" -ge 1 ]] || fail "[${name}] items length < 1"
  [[ -n "${pg}" ]] || fail "[${name}] primaryGroup empty"
  [[ -n "${sg}" ]] || fail "[${name}] secondaryGroup empty"

  if [[ -n "${expect_reason}" ]]; then
    contains_reason "${resp}" "${expect_reason}" \
      || fail "[${name}] reasons does not contain '${expect_reason}'"
  fi

  ok "[${name}] items=${items_len}, primary=${pg}, secondary=${sg}"
}

# ------------ cases ------------
# A. 姿勢あり → 理由に「横向き寝」が含まれること（posture=side が理由タグへ反映）
run_case "posture(side+supine)" \
  '{"postures":["side","supine"],"concerns":[],"pillowMaterial":[]}' \
  "横向き寝"

# B. 悩みのみ（肩こり） → グループ/件数が妥当（中身は null でないこと）
run_case "concern(stiff_shoulder)" \
  '{"postures":[],"concerns":["stiff_shoulder"],"pillowMaterial":[]}' 

# C. 素材のみ（パイプ） → グループ/件数が妥当
run_case "material(pipe)" \
  '{"postures":[],"concerns":[],"pillowMaterial":["pipe"]}'

# D. すべて空（ガードの挙動確認） → グループ/件数が妥当
run_case "empty(all)" \
  '{"postures":[],"concerns":[],"pillowMaterial":[]}' 

ok "all cases passed"
