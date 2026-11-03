# SDD: 과목 관리

## 구조
- `src/SubjectManager.jsx`: 화면 전체 (구현 대상)
- 뒤로 가기는 `src/App.jsx`의 `navigate('/')`를 쓴다

## 상태
- 처음 열 때 `GET /api/subjects`를 부른다
- 내 과목 목록은 최근 사용 순이고, 보관한 과목은 숨긴다
- 새 과목 폼은 화면에 늘 보인다
- 처음에는 표준 과목을 고르지 않은 상태, 색은 `blue`다
- 추가에 성공하면 목록에 넣고 폼을 비운다
- 만들 수 없을 때 맨 아래 버튼을 `disabled`로 둔다

## 마크업 약속
- 누를 수 있는 것은 `button`을 쓴다
- 이름 칸은 `input type="text"`를 쓴다
- 색 버튼의 `aria-label`은 색 키로 한다 (`blue` 등)
