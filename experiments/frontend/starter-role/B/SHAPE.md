# 구조 B: 필요할 때만 분리

API와 타입만 나누고, 나머지는 화면 곁에 둔다.

```text
src/api/subjects.ts     과목 API
src/api/sessions.ts     세션 API
src/api/plans.ts        계획 API
src/types.ts            공용 타입
src/SubjectSheet.tsx    화면, 상태, 동작
src/SubjectManager.tsx  화면, 상태, 동작
src/PlanSheet.tsx       화면, 상태, 동작
```

- 두 화면 이상에 쓰는 규칙 · 문구 · 훅만 `src/shared.ts`에 둔다
- 한 화면에서만 쓰는 로직은 그 화면 파일 안에 둔다
- 커스텀 훅은 두 화면 이상에서 쓸 때만 만든다
