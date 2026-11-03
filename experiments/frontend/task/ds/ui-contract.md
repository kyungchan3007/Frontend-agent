# 공통 컴포넌트 계약

`src/ui/index.js`에서 아래 이름으로 내보낸다. 값은 `components/`의 카드와 `src/tokens.css`를 따른다.

| 이름 | 속성 | 뜻 |
|---|---|---|
| `Button` | `variant` `size` `disabled` `onClick` `className` | 종류 primary · secondary · ghost · danger, 크기 L · M · S. 기본 primary · L |
| `Pressable` | `onClick` `disabled` `aria-*` `className` | 모양 없는 `button`. 과목 줄 · 링크 · 뒤로 가기에 쓴다 |
| `Chip` | `selected` `onClick` `className` | 선택할 수 있는 칩 |
| `TextField` | `value` `onChange` `error` `trailing` `type` `id` `placeholder` `aria-label` | 입력 칸. `onChange`는 문자열을 넘긴다. `error`는 칸 아래 문구 |
| `Toggle` | `checked` `onChange` `aria-label` | `role="switch"` 켜고 끄기 |
| `SubjectDot` | `color` | 과목 색 점. 색 키는 blue cyan amber violet green rose slate |
| `ColorPicker` | `value` `onChange` | 색 7개 버튼. 각 `aria-label`은 색 키 |
| `BottomSheet` | `title` `children` | 어두운 배경 + 손잡이 + 제목 + 내용 |
| `Toast` | `children` | 위쪽 안내 |
| `OfflineBanner` | `children` | 오프라인 줄 |

- 누를 수 있는 것은 모두 `button` 요소다
- `Button`의 `disabled`는 `disabled` 속성으로 나타낸다
- 파일 안에 hex 색을 쓰지 않는다. 토큰 클래스만 쓴다
