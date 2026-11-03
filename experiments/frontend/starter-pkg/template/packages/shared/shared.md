# @app/shared 사용법

```js
import { useSubjects, createSubject, MESSAGES, formatToday } from '@app/shared'
```

- 이름과 시그니처는 `shared-contract.md`와 같다.
- `setSubjects`는 전체 목록(`all`)을 바꾼다. `subjects`는 보관 제외 + 최근 사용 순으로 자동 계산된다.
- `apiGet`·`apiPost`는 `{ status, data }`를 돌려준다. 네트워크 오류는 던지므로 `catch`에서 `MESSAGES.offline`을 쓴다.
- `formatToday(130 * 60)` → `2:10` (시:분).
