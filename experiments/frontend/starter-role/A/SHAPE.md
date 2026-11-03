# 구조 A: 전부 분리

화면마다 역할별로 파일을 나눈다.

```text
src/features/subject-sheet/
  SubjectSheet.tsx        화면 표시만
  useSubjectSheet.ts      상태와 동작을 묶는 커스텀 훅
  subjectSheet.logic.ts   React 없는 순수 함수와 규칙
  subjectSheet.api.ts     이 화면의 API 호출
  subjectSheet.types.ts   타입
src/features/subject-manager/   같은 방식
src/features/plan-sheet/        같은 방식
```

- `.tsx`에는 `fetch`, 규칙, 계산을 두지 않는다
- 화면끼리 같은 코드가 필요하면 각 화면 폴더에 두지 말고 `src/features/common/`에 같은 역할별 파일로 둔다
