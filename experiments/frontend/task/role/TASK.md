# 작업: 역할 분담 구조로 옮기기

`src/`의 화면 3개(`SubjectSheet`, `SubjectManager`, `PlanSheet`)를 TypeScript로 옮기고 `SHAPE.md`의 구조로 나눈다.

## 지킬 것
- 화면 동작과 문구를 바꾸지 않는다
- `src/App.jsx`는 `src/App.tsx`로 옮기고, `navigate`도 그대로 내보낸다. `src/main.jsx`도 맞춘다
- `src/ui`의 컴포넌트는 고치지 않고 가져다 쓴다
- `src/shared`는 없애고, 그 안의 코드를 `SHAPE.md`의 구조에 맞게 옮긴다
- 외부 패키지를 새로 더하지 않는다
- 구조 문서에 없는 방식으로 나누지 않는다

## 확인
- `npx tsc --noEmit`이 통과한다
- `node tools/check.mjs`가 GATE PASS다
