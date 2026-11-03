# 시안 지도

구현 전에 해당 상태의 화면과 패널을 함께 읽는다. 패널이 동작과 문구의 기준이다.

| 상태 | 화면 | 패널 |
|---|---|---|
| 기본 | `screens/15.png` | `panels/15.png` |
| 이름이 너무 길 때 | `screens/15-E.png` | `panels/15-E.png` |
| 같은 이름 | `screens/15-D.png` | `panels/15-D.png` |
| 20개를 넘을 때 | `screens/15-M.png` | `panels/15-M.png` |
| 과목 0개 | `screens/15-Z.png` | `panels/15-Z.png` |
| 오프라인 배너 | | `panels/banner-offline.png` |

## 정해 둔 것
- 오프라인에서 시작하면 배너와 토스트를 함께 보여 준다
- 측정 중 이동은 `/timer/{세션 id}`
- 문구는 한 글자까지 패널과 같게 쓴다

## 글자
- Noto Sans KR, 줄 높이 140%, 자간 -1%
