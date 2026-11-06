# 계획

## 무엇을 · 왜
- 이슈 #45: `experiments/monorepo/step-1-current/`에 터보레포 뼈대를 만든다 (앱 3개, 빈 공용 패키지 3개, turbo.json)

## 애매한 곳
- 앱은 Vite + React + TypeScript, 패키지 이름은 `@repo/` (이슈 #45에서 합의)
- 의존성 버전은 pnpm이 고른 최신 버전을 쓴다 (가정)

## 파일 계획
- experiments/monorepo/step-1-current/**
- .agents/specs/0032-turbo-skeleton/**

## 계획 밖 변경 이유
- `experiments/monorepo/research/02-why-turborepo/`는 이전 브랜치에서 남은 미추적 파일이라 이번 커밋에 넣지 않는다

## 완료 기준
- [x] `pnpm install`이 성공한다
- [x] `pnpm build`로 앱 3개가 빌드된다
- [x] 바로 다시 `pnpm build`를 하면 캐시를 써서 다시 빌드하지 않는다 (3 cached, FULL TURBO)
- [x] bash .agents/checks.sh PASS

## 허점
- 빈 패키지 3개는 아직 어느 앱에도 연결되지 않았다 (작업 이슈 B~D에서 연결)
