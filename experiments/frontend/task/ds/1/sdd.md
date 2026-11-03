# SDD: 과목 선택 시트

## 구조
- `src/App.jsx`: 경로 분기 (이미 있음)
  - `/`: 홈 + 시트
  - `/subjects`: 과목 관리
  - `/timer/:id`: 측정 화면
- `src/SubjectSheet.jsx`: 시트 전체 (구현 대상)
- 화면 이동은 `src/App.jsx`의 `navigate(path)`를 쓴다

## 상태
- 목록 보기: 과목 목록 + 시작 버튼
- 추가 폼: 이름 · 표준 과목 · 색 + 추가하기
- 처음 열 때 `GET /api/subjects`, `GET /api/sessions/current`를 부른다

## 마크업 약속
- 누를 수 있는 것은 `button`을 쓴다
- 이름 칸은 `input type="text"`를 쓴다
- 비활성은 `disabled` 속성으로 나타낸다
- 색 버튼의 `aria-label`은 색 키로 한다 (`blue` 등)
