# 계획

## 무엇을 · 왜
- 공통 코드 리뷰 병목을 줄이는 설계 3개를 가상의 팀 장면 5개로 시험하고, 개발자가 봤을 때 좋은지 나쁜지 판단할 재료를 만든다

## 애매한 곳
- 비용과 점수 채점은 하지 않는다 (확인됨: 개발자 관점의 판단이 목적)
- 숨은 테스트는 화면이 깨졌는지만 본다 (가정)
- 시작 코드는 앞 실험의 "필요할 때만 분리" 구조로 한다 (가정)

## 파일 계획
- README.md
- experiments/frontend/design-env.md
- experiments/frontend/bench/make-design.mjs
- experiments/frontend/bench/run-scenes.mjs
- experiments/frontend/bench/run-stack.mjs
- experiments/frontend/task/design/**
- experiments/frontend/starter-design/**
- experiments/frontend/results/**
- .agents/specs/0017-env-design/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 설계 3개 앱이 숨은 테스트를 통과한다
- [x] 장면별 변경분과 판단 초안이 결과 문서에 있다
- [x] 변경을 쌓은 비교의 판단 초안이 결과 문서에 있다

## 허점
- 에이전트가 쓸 삭제 명령을 미리 확인하지 않아 장면 5를 다시 돌렸다. 실행 기록을 처음부터 남겼어야 원인을 바로 찾았다
