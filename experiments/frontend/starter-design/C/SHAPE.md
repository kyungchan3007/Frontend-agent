# 설계 C: 화면에 먼저 두고 나중에 올리기

공통은 최소로 두고, 화면 폴더에 먼저 만든다.

```text
src/screens/subject-sheet/     화면과 그 화면만 쓰는 컴포넌트
src/screens/subject-manager/   같은 방식
src/screens/plan-sheet/        같은 방식
src/ui/                        두 화면 이상이 같은 모양으로 쓰는 컴포넌트만
```

- 한 화면에서만 쓰는 컴포넌트는 그 화면 폴더에 둔다
- 새로운 모양이나 변형은 `src/ui`를 고치지 않고 화면 폴더에 먼저 만든다
- 두 번째 화면에서 같은 것이 필요해지면 그때 `src/ui`로 옮긴다
