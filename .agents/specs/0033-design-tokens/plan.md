# 계획

## 무엇을 · 왜
- 이슈 #47: `packages/design-tokens`에 색 토큰 20개(Palette 10 → Semantic 10)를 CSS 변수로 만들고, Tailwind v4로 앱 3개에 연결한다

## 애매한 곳
- Tailwind 연결 파일(theme.css)은 토큰 패키지 안에 둔다 (Tailwind 문서 "Sharing across projects")
- 다른 변수를 가리키므로 `@theme inline`을 쓴다 (Tailwind 문서 "Referencing other variables")
- 토큰 이름(`--primary`)과 Tailwind 이름(`--color-primary`)을 나눈다 (shadcn/ui 문서 "Theming")

## 파일 계획
- experiments/monorepo/step-1-current/**
- .agents/specs/0033-design-tokens/**

## 계획 밖 변경 이유
- `experiments/monorepo/research/02-why-turborepo/`는 이전 브랜치에서 남은 미추적 파일이라 이번 커밋에 넣지 않는다
- `experiments/monorepo/research/03-tailwind-v4/`는 이슈 댓글용 근거 이미지라 커밋하지 않고 GitHub 첨부로 올린다

## 완료 기준
- [x] 빌드
- [x] 토큰 색 (세 앱 제목 rgb(37, 99, 235))
- [x] 게이트 통과

## 허점
- 처음에는 토큰과 Tailwind 이름이 같아 결과 CSS에 `--color-primary: var(--color-primary)`가 생겼다. 이름을 나눠 없앴다
