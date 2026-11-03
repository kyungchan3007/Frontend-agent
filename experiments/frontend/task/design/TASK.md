# 작업: 설계 방식에 맞게 다시 나누기

`src/`의 화면과 `src/ui`를 `SHAPE.md`의 설계에 맞게 고친다.

## 지킬 것
- 화면 동작과 문구, 모양을 바꾸지 않는다
- API(`src/api`), 타입(`src/types.ts`), 규칙(`src/shared.ts`)의 내용은 바꾸지 않는다
- 외부 패키지를 새로 더하지 않는다
- 설계 문서에 없는 방식으로 나누지 않는다

## 확인
- `npx tsc --noEmit`이 통과한다
- `node tools/check.mjs`가 GATE PASS다
