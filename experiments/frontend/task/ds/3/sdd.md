# SDD: 계획 추가 시트

## 구조
- `src/PlanSheet.jsx`: 시트 전체 (구현 대상)

## 상태
- 처음 열 때 `GET /api/subjects`, `GET /api/plans`를 부른다
- 처음 값: 가장 최근 과목, 19:00 → 21:00, 반복은 평일, 알림 켬
- 과목 줄을 누르면 과목 선택 시트와 같은 목록이 열리고, 과목을 누르면 반영하고 닫는다
- 시간이 다른 계획과 겹치면 안내를 보여 주지만 저장은 할 수 있다
- 종료가 시작보다 빠르거나 같으면 저장할 수 없다
- 저장에 성공하면 `navigate('/')`로 간다

## 마크업 약속
- 누를 수 있는 것은 `button`을 쓴다
- 시간 칸은 `input type="time"` 두 개이고 `aria-label`은 "시작" "종료"다
- 알림 토글은 `role="switch"`, `aria-checked`를 쓴다
- 반복 값: 안 함 `none`, 매일 `daily`, 평일 `weekdays`, 요일 선택 `custom`
