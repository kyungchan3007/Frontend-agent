# 작업: 패키지 분리

공통 코드를 앱 밖의 패키지로 분리한다. npm workspaces를 쓴다.

| 지금 | 분리 후 | 패키지 이름 |
|---|---|---|
| `src/ui/` | `packages/ui/` | `@app/ui` |
| `src/shared/` | `packages/shared/` | `@app/shared` |

## 할 일
- 루트 `package.json`에 workspaces를 설정한다
- 패키지마다 `package.json`을 두고 진입점을 정한다. React는 peerDependencies로 둔다
- 앱 코드의 import를 패키지 이름으로 바꾼다
- 설명 문서를 패키지로 옮긴다: `ui.md`, `shared.md`
- Tailwind가 패키지 안의 클래스도 읽게 한다
- `npm install`로 연결하고 `npx vite build`로 확인한다
- 남는 `src/ui`, `src/shared`는 없앤다

## 지킬 것
- 외부 패키지를 새로 더하지 않는다
- 화면 동작과 모양은 바꾸지 않는다
- 게이트가 있으면 `node tools/check.mjs`가 GATE PASS여야 한다
