// 채점과 게이트가 함께 쓰는 가짜 API
const PREFIX = process.env.API_PREFIX ?? '/api';

export const S = (id, name, standardSubject, color, todaySeconds, lastUsedAt, archived = false) => ({
  id, name, standardSubject, color, todaySeconds, lastUsedAt, archived,
});

export const FOUR = [
  S('kor', '국어 · 문학', '국어', 'amber', 6720, '2026-10-30T09:00:00Z'),
  S('han', '한국사', '한국사', 'violet', 0, '2026-10-28T09:00:00Z'),
  S('mat', '수학 · 미적분', '수학', 'blue', 7800, '2026-11-01T09:00:00Z'),
  S('eng', '영어 · 독해', '영어', 'cyan', 6000, '2026-10-31T09:00:00Z'),
];

export const TWENTY = Array.from({ length: 20 }, (_, i) =>
  S(`s${i}`, `과목 ${i + 1}`, '기타', 'slate', 0, `2026-10-${String(i + 1).padStart(2, '0')}T09:00:00Z`));

export async function mockApi(page, { subjects = FOUR, session = null, plans = [], createSubject, startSession } = {}) {
  const calls = { subjects: [], sessions: [], plans: [] };
  const json = (route, status, body) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url()).pathname;
    // 개발 서버의 src/api 파일은 API 요청이 아니다
    if (url.startsWith('/src/')) return route.continue();
    if (req.method() === 'GET' && url === `${PREFIX}/subjects`) return json(route, 200, { subjects });
    if (req.method() === 'GET' && url === `${PREFIX}/sessions/current`) return json(route, 200, { session });
    if (req.method() === 'GET' && url === `${PREFIX}/plans`) return json(route, 200, { plans });
    if (req.method() === 'POST' && url === `${PREFIX}/subjects`) {
      const body = req.postDataJSON();
      calls.subjects.push(body);
      if (createSubject) return createSubject(route, json, body);
      if (subjects.some((s) => s.name === body.name)) return json(route, 409, { code: 'SUBJECT_NAME_TAKEN' });
      if (subjects.filter((s) => !s.archived).length >= 20) return json(route, 409, { code: 'SUBJECT_LIMIT' });
      return json(route, 201, S('new', body.name, body.standardSubject, body.color, 0, null));
    }
    if (req.method() === 'POST' && url === `${PREFIX}/sessions`) {
      const body = req.postDataJSON();
      calls.sessions.push(body);
      if (startSession) return startSession(route, json, body);
      return json(route, 201, { id: 'sess1' });
    }
    if (req.method() === 'POST' && url === `${PREFIX}/plans`) {
      const body = req.postDataJSON();
      calls.plans.push(body);
      return json(route, 201, { id: 'plan1', ...body });
    }
    return json(route, 404, {});
  });
  return calls;
}

export const nameInput = (page) => page.locator('input[type="text"], input:not([type])').first();

// 미리 꺼 두는 구현과 눌렀을 때 막는 구현을 모두 받는다
export async function pressIfOn(page, name) {
  const b = page.getByRole('button', { name });
  await page.waitForTimeout(100);
  if (await b.isEnabled()) await b.click();
  await page.waitForTimeout(100);
}
export const pressAdd = (page) => pressIfOn(page, '추가하기');

// 표준 과목을 고르는 모양이 달라도 동작은 따로 채점한다
export async function pickStandard(page, standard) {
  const select = page.locator('select');
  if (await select.count()) return select.first().selectOption(standard);
  await page.getByText(standard, { exact: true }).last().click();
}

async function openForm(page, name, standard, color, submit) {
  await page.getByRole('button', { name: /새 과목 추가/ }).click();
  await nameInput(page).fill(name);
  await pickStandard(page, standard);
  await page.locator(`[aria-label="${color}"]`).click();
  if (submit) await pressAdd(page);
}

// 시안과 같은 상태로 화면을 맞춘다
export const STATES = {
  '15': { path: '/', subjects: FOUR, act: async () => {} },
  '15-E': { path: '/', subjects: FOUR, act: (p) => openForm(p, '미적분 심화 문제풀이 정리하기', '수학', 'blue', false) },
  '15-D': { path: '/', subjects: FOUR, act: (p) => openForm(p, '수학 · 미적분', '수학', 'blue', true) },
  '15-M': { path: '/', subjects: TWENTY, act: (p) => openForm(p, '물리 · 역학', '과학탐구', 'green', true) },
  '15-Z': { path: '/', subjects: [], act: async () => {} },
  '16': {
    path: '/subjects',
    subjects: [...FOUR,
      S('a1', '보관 1', '기타', 'slate', 0, null, true), S('a2', '보관 2', '기타', 'slate', 0, null, true)],
    act: async (p) => {
      await nameInput(p).fill('물리 · 역학');
      await pickStandard(p, '과학탐구');
      await p.locator('[aria-label="green"]').click();
    },
  },
  '32': { path: '/plan', subjects: FOUR, act: async () => {} },
};
