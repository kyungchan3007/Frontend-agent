# 엔티티와 API

## Subject
| 필드 | 타입 | 뜻 |
|---|---|---|
| id | string | 식별자 |
| name | string | 과목 이름 |
| standardSubject | string | 표준 과목 |
| color | string | 색 키 |
| todaySeconds | number | 오늘 공부한 초 |
| lastUsedAt | string \| null | 마지막 공부 시각 (ISO) |
| archived | boolean | 보관 여부 |

- 색 키: `blue` `cyan` `amber` `violet` `green` `rose` `slate`
- 표준 과목: 국어 수학 영어 한국사 사회탐구 과학탐구 제2외국어 기타

## API
| 요청 | 응답 |
|---|---|
| `GET /api/subjects` | `{ subjects: Subject[] }` |
| `POST /api/subjects` | 201 `Subject` |
| `GET /api/sessions/current` | `{ session: { id, subjectId } \| null }` |
| `POST /api/sessions` | 201 `{ id }` |

- `POST /api/subjects` 본문: `{ name, standardSubject, color }`
- `POST /api/sessions` 본문: `{ subjectId }`

## 오류
| 상태 | code | 추가 필드 |
|---|---|---|
| 409 | `SUBJECT_NAME_TAKEN` | |
| 409 | `SUBJECT_LIMIT` | |
| 422 | `SUBJECT_NAME_TOO_LONG` | |
| 409 | `SESSION_ALREADY_RUNNING` | `sessionId` |
