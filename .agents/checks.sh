#!/usr/bin/env bash
# 게이트 — 이게 PASS여야 "완료". 사람도 에이전트도 같은 명령을 쓴다.
#   bash .agents/checks.sh                    루프 자동 판정 (작업 폴더에 sdd·prd 있으면 Full, 없으면 Quick)
#   LOOP=full bash .agents/checks.sh          강제로 Full Loop
#   ALLOW_PROTECTED=1 bash .agents/checks.sh  사람이 보호 파일 변경을 승인할 때만
#   SCOPE_STRICT=1 bash .agents/checks.sh     계획 밖 변경을 경고 대신 실패로
set -u
cd "$(dirname "$0")/.."
fail=0
run() {
  local name="$1"; shift
  echo ""; echo "▶ $name"
  if "$@"; then echo "  ✅ PASS — $name"; else echo "  ❌ FAIL — $name"; fail=1; fi
}
has_script() { [ -f package.json ] && node -e "process.exit(require('./package.json').scripts?.['$1']?0:1)"; }

MODE=$(node .agents/scripts/loop-mode.mjs)
echo "🔁 루프: $MODE"

# 1) 프로젝트 검사 — package.json 에 있는 것만 (없으면 건너뜀). 다른 언어면 여기에 명령 추가
#    Quick: typecheck · lint · test   /   Full: + build · test:e2e
QUICK_SCRIPTS="typecheck lint test"
FULL_SCRIPTS="build test:e2e"
for s in $QUICK_SCRIPTS; do has_script "$s" && run "프로젝트 $s" npm run -s "$s"; done
if [ "$MODE" = "full" ]; then
  for s in $FULL_SCRIPTS; do has_script "$s" && run "프로젝트 $s (Full)" npm run -s "$s"; done
fi

# 2) 하네스
run "하네스 자체 테스트" env -u LOOP node --test .agents/scripts/harness.test.mjs
run "작업 기록 ($MODE)" env LOOP="$MODE" node .agents/scripts/spec-check.mjs
run "보호 파일" node .agents/scripts/protected-check.mjs
run "작업 범위 (경고)" node .agents/scripts/scope-check.mjs

echo ""; echo "════════════════════════════════════════"
if [ "$fail" -eq 0 ]; then echo " 결과: ✅ ALL PASS ($MODE) — 완료라고 말해도 됨"; else echo " 결과: ❌ FAIL ($MODE) — 아직 완료 아님"; fi
echo "════════════════════════════════════════"
exit "$fail"
