# 구조 C: 한 파일

화면 파일 하나에 타입 · API · 로직 · 표시를 모두 둔다.

```text
src/SubjectSheet.tsx
src/SubjectManager.tsx
src/PlanSheet.tsx
```

- `src/` 아래에 새 파일을 만들지 않는다 (`src/ui`는 그대로 쓴다)
- 화면끼리 같은 코드가 필요해도 각 파일에 따로 둔다
