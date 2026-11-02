# 구조 · 경계

> 사람과 에이전트가 같이 읽는 구조 설명. **코드로 확인할 수 있는 경계는 린트로 옮기고 여기엔 이유만 남긴다.**

## 폴더
<!-- 예:
src/
├── features/<기능>/   기능 단위 (다른 기능을 직접 import 하지 않음)
├── shared/            공용 (features 를 import 하지 않음)
└── app/               라우트 · 조립
-->

## 경계 규칙 → 강제 위치
| 규칙 | 강제 | 위치 |
| --- | --- | --- |
| <!-- shared 는 features 를 import 하지 않는다 --> | <!-- eslint no-restricted-imports --> | <!-- eslint.config --> |
