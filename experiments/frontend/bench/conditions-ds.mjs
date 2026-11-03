// 디자인 시스템 실험의 조건별 안내
export const MODEL = 'claude-sonnet-5-5';
export const EFFORT = 'low';
export const PROMPT = 'TASK.md의 과제를 구현하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.';

const BASE = `# 작업 안내

- 과제: TASK.md
- 설계: sdd.md, entities.md
- 시안 지도: design-map.md. 구현 전에 먼저 읽고, 지도에 적힌 패널을 모두 읽는다
- 완료 전 \`node tools/check.mjs\`가 GATE PASS여야 한다
- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 \`node\` · \`npx\`로 바로 실행한다
`;
const TOKENS = `- 색 · 모서리 값은 \`src/tokens.css\`의 토큰으로 쓴다. 필요한 값이 없으면 토큰을 더한다. 원본 값: tokens.json
`;
const UI = `- 공통 컴포넌트: \`src/ui/\`, 설명은 ui.md. 있는 부품을 먼저 쓰고, 여러 화면에 쓸 모양은 src/ui에서 고친다
`;
const LINT = `- \`node tools/lint-ui.mjs\`가 통과해야 한다. 게이트에 포함돼 있다
`;

export const CONDITIONS = {
  A: { tokens: false, ui: false, lint: false, claude: BASE },
  B: { tokens: true, ui: false, lint: false, claude: BASE + TOKENS },
  C: { tokens: true, ui: true, lint: false, claude: BASE + TOKENS + UI },
  D: { tokens: true, ui: true, lint: true, claude: BASE + TOKENS + UI + LINT },
};
