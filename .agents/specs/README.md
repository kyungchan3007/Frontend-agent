# 작업 의도 (Intent · specs)

> 무엇을 · 왜 · 어떻게 만들지 작업마다 남긴다. **원본은 request.md 원문**, 나머지는 거기서 나온 파생 문서

## Quick Loop · Full Loop
| 루프 | 언제 | 파일 | 게이트 | 명령 |
| --- | --- | --- | --- | --- |
| Quick | 작은 변경 · 설계 고민 적음 | request · plan | typecheck · lint · test | `npm run spec:new -- 이름` |
| Full | 경계·계약 변경 · 여러 세션 · 여러 에이전트 | request · prd · sdd · trace | Quick + build · e2e | `npm run spec:new -- 이름 --full` |

- 루프는 자동 판정: 작업 폴더에 prd·sdd 가 있으면 Full, 없으면 Quick (`LOOP=full` 로 강제)
- Quick 인데 바뀐 파일이 10개를 넘으면 게이트가 Full 로 올리라고 경고한다
- Quick 으로 시작했다가 커지면 plan.md 를 prd · sdd · trace 로 나누면 된다
- 브랜치 이름에 번호를 넣는다: `task/0001-cart-qty` → 게이트가 이 번호로 작업 폴더를 찾는다

## 파일마다 하는 일
| 파일 | 답하는 질문 | 핵심 칸 |
| --- | --- | --- |
| `request.md` | 무엇을 요청받았나 | 원문 그대로 (요약 금지 · 고정) |
| `plan.md` | 작은 작업의 전부 | 무엇을 · 애매한 곳 · 파일 계획 · 완료 기준 · 허점 |
| `prd.md` | 무엇을 · 왜 | 문제 · 목표 · 비목표 · 애매한 곳 · 완료 기준 |
| `sdd.md` | 어떻게 | 접근 · 대안 · 파일 계획 · 위험 · 검증 계획 · 달라진 점 |
| `trace.md` | 어떻게 판단했나 | 단계별 판단 · 이유 · 허점 |

## 게이트가 보는 것
- request.md 와 Quick: plan.md / Full: prd · sdd · trace 가 채워져 있는가
- 파일 계획(plan.md 또는 sdd.md) 밖 변경이 있는가 → 경고
- 요구가 바뀌면 request.md 를 덮어쓰지 말고 prd · sdd · trace 에 근거와 함께 남긴다
