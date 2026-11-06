# 터보레포에서 앱 내부를 어떤 구조로 나눌까

관련 이슈: [#37](https://github.com/kyungchan3007/frontend-architecture/issues/37) · 실험 이슈: [#34](https://github.com/kyungchan3007/frontend-architecture/issues/34)

후보마다 공식 문서를 확인하고, 근거가 되는 문장은 노란색으로 표시해 스크린샷으로 남겼습니다.

## 1. 터보레포 공식 문서

확인한 날짜: 2026-11-06

- [Structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
- [Creating an Internal Package](https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package)
- [Internal Packages](https://turborepo.dev/docs/core-concepts/internal-packages)
- [Package and Task Graphs](https://turborepo.dev/docs/core-concepts/package-and-task-graph)

### 문서에서 확인한 것

| 근거 | 스크린샷 |
|---|---|
| 앱은 `apps/`, 나머지는 `packages/`로 시작 | [turbo-01](screenshots/turbo-01-apps-packages.png) |
| 패키지 안에 패키지는 둘 수 없음 | [turbo-01](screenshots/turbo-01-apps-packages.png) |
| 폴더로 묶으려면 `packages/group/*` | [turbo-01](screenshots/turbo-01-apps-packages.png) |
| 패키지 하나를 작은 프로젝트처럼 | [turbo-02](screenshots/turbo-02-package-unit.png) |
| barrel 파일 대신 `exports`로 진입점 | [turbo-03](screenshots/turbo-03-exports-no-barrel.png) |
| 패키지끼리 `../`로 파일 접근 금지 | [turbo-04](screenshots/turbo-04-no-cross-package-path.png) |
| 패키지마다 목적은 하나 | [turbo-05](screenshots/turbo-05-one-purpose.png) |
| 도메인 전용 패키지도 예시에 있음 | [turbo-05](screenshots/turbo-05-one-purpose.png) |
| 앱에는 공유 코드를 두지 않음 | [turbo-05](screenshots/turbo-05-one-purpose.png) |
| 패키지 빌드 방식 3가지 | [turbo-06](screenshots/turbo-06-compile-strategies.png) |
| Just-in-Time은 캐시 불가, 타입 오류 전파 | [turbo-07](screenshots/turbo-07-jit-tradeoffs.png) |

- **목적은 하나:** 엄격한 규칙은 아니고, 저장소 규모 · 조직 · 팀의 필요에 따라 정하는 권장 사항이라고 적혀 있습니다.
- **목적별 예시:** `@repo/ui`(공용 UI), `@repo/tool-specific-config`(도구 설정), `@repo/graphs`(도메인 전용 라이브러리)를 듭니다.
- **앱에 공유 코드:** 드물게 예외가 있다고 함께 적혀 있습니다.

### 문서에서 다루지 않는 것

- 앱 안을 종류별 · 기능별 · 도메인별 중 무엇으로 나눌지는 위 4쪽에서 다루지 않았습니다.
- 터보레포는 앱과 패키지의 경계까지만 정하고, 그 안의 구조는 다른 기준으로 정해야 하는 것으로 보입니다.
- 그래서 앱 내부 구조는 다음 후보(FSD, bulletproof-react 등)에서 확인하려고 합니다.

### 이번 실험에 연결해 본 생각 (논의 대상)

- **`apps/`와 `packages/`:** 서비스 3개를 `apps/`에, 공용 코드를 `packages/`에 두는 것은 현업 구조와 같습니다.
- **공용 패키지 나누는 단위:** 현업에서도 앱 간 공유 코드는 `packages/` 아래 목적별 패키지(`ui`, `design-tokens` 등)로 나누었고, 문서 권장과 같습니다. 한 도메인 안에서만 쓰는 코드는 그 앱의 `shared/`에 두었습니다.
- **서비스 공통 코드의 위치:** 한 서비스 안에서만 쓰는 공통 코드는 다른 앱과 공유하지 않으니, 앱 안에 두어도 문서 권장과 어긋나지 않는다고 봤습니다.
- **barrel 파일:** 공용 패키지에서 `index`로 한 번에 내보내기보다, `exports`로 경로를 나누는 쪽을 검토할 만해 보입니다.
