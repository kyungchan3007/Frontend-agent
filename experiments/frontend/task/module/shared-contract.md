# 공통 모듈 계약

`src/shared/index.js`에서 아래 이름으로 내보낸다. React 화면 코드는 넣지 않는다.

| 이름 | 쓰는 법 | 뜻 |
|---|---|---|
| `API_BASE` | 문자열 `/api` | API 경로 앞부분. 경로는 여기 한 곳에만 쓴다 |
| `apiGet` | `apiGet(path)` → `{ status, data }` | `API_BASE + path`로 GET |
| `apiPost` | `apiPost(path, body)` → `{ status, data }` | `API_BASE + path`로 JSON POST |
| `NAME_MAX` · `SUBJECT_MAX` | 숫자 15 · 20 | 과목 규칙 |
| `MESSAGES` | `tooLong` `same` `limit` `offline` | 문구. `tooLong`은 `NAME_MAX`로 만든다 |
| `STANDARD_SUBJECTS` | 문자열 8개 | 표준 과목, 순서 고정 |
| `isNameTooLong` | `isNameTooLong(name)` | 이름 길이 검사 |
| `activeSubjects` | `activeSubjects(list)` | 보관 제외 + 최근 사용 순 |
| `formatToday` | `formatToday(seconds)` | `2:10` 형식 |
| `useSubjects` | `useSubjects()` → `{ subjects, setSubjects, all, loading }` | 과목 목록을 불러온다. `subjects`는 보관 제외 + 최근 사용 순, `all`은 전부 |
| `createSubject` | `createSubject(body)` → `{ status, data }` | 과목 만들기 |
| `useOnline` | `useOnline()` → boolean | 온라인 여부 |

## 문구
- `tooLong`: `이름은 15자까지 쓸 수 있어요. 조금 줄여 주세요`
- `same`: `같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요`
- `limit`: `과목은 20개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요`
- `offline`: `인터넷 연결을 확인해 주세요`
