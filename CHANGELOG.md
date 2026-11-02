# Changelog

## 다음 버전
- 기여 방식: 원본에는 이슈로만 (외부 PR 받지 않음, main 보호 규칙)
- 개선 제안 이슈 폼에 코드 예시 칸

## v0.1.0 (2026-10-28)

첫 공개 버전.

### 게이트 · 하네스
- 완료 게이트 `checks.sh` · Stop 훅 (실패하면 에이전트가 끝내지 못함)
- 보호 파일 차단 `protected.txt` (사람 승인: `ALLOW_PROTECTED=1` · PR `harness-approved` 라벨)
- 작업 범위 경고 (파일 계획 ↔ `git diff`) · 기존 테스트 단언 삭제 경고
- 작업 폴더 밖 쓰기 차단 PreToolUse 훅

### 작업 흐름
- Quick Loop (request · plan) · Full Loop (request · prd · sdd · trace) 자동 판정
- `npm run spec:new -- 이름 [--full]`

### 선택 모듈
- 오케스트레이션 뼈대 (6요소 · 4패턴 · 역할 지침서 필수 칸 검사)
