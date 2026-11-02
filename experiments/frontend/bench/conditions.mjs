// 조건별로 작업 폴더에 넣을 것과 CLAUDE.md
export const MODEL = 'claude-sonnet-5-5';
export const EFFORT = 'low';
export const PROMPT = 'TASK.md의 과제를 구현하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.';

const BASE = `# 작업 안내\n\n- 과제: TASK.md\n- 설계: sdd.md, entities.md\n- 시안: screens/\n`;
const MAP = `- 시안 지도: design-map.md. 구현 전에 먼저 읽고, 지도에 적힌 패널을 모두 읽는다\n`;
const GATE = `- 완료 전 \`node tools/check.mjs\`가 GATE PASS여야 한다\n`;
const SHOT = `- \`node tools/shot.mjs\`로 상태별 화면을 찍어 시안과 비교한다. .shots/의 화면과 차이 이미지를 직접 읽고 고친다\n`;

export const CONDITIONS = {
  A: { map: false, gate: false, shot: false, claude: BASE },
  B: { map: true, gate: false, shot: false, claude: BASE + MAP },
  C: { map: true, gate: true, shot: false, claude: BASE + MAP + GATE },
  D: { map: true, gate: true, shot: true, claude: BASE + MAP + GATE + SHOT },
};
