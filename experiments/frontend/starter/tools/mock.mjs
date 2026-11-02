// 채점과 게이트가 함께 쓰는 가짜 API
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

export async function mockApi(page, { subjects = FOUR, session = null, createSubject, startSession } = {}) {
  const calls = { subjects: [], sessions: [] };
  const json = (route, status, body) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url()).pathname;
    if (req.method() === 'GET' && url === '/api/subjects') return json(route, 200, { subjects });
    if (req.method() === 'GET' && url === '/api/sessions/current') return json(route, 200, { session });
    if (req.method() === 'POST' && url === '/api/subjects') {
      const body = req.postDataJSON();
      calls.subjects.push(body);
      if (createSubject) return createSubject(route, json, body);
      if (subjects.some((s) => s.name === body.name)) return json(route, 409, { code: 'SUBJECT_NAME_TAKEN' });
      if (subjects.filter((s) => !s.archived).length >= 20) return json(route, 409, { code: 'SUBJECT_LIMIT' });
      return json(route, 201, S('new', body.name, body.standardSubject, body.color, 0, null));
    }
    if (req.method() === 'POST' && url === '/api/sessions') {
      const body = req.postDataJSON();
      calls.sessions.push(body);
      if (startSession) return startSession(route, json, body);
      return json(route, 201, { id: 'sess1' });
    }
    return json(route, 404, {});
  });
  return calls;
}

// 시안과 같은 상태로 화면을 맞춘다
export const nameInput = (page) => page.locator('input[type="text"], input:not([type])').first();

// 미리 꺼 두는 구현과 눌렀을 때 막는 구현을 모두 받는다
export async function pressAdd(page) {
  const add = page.getByRole('button', { name: '추가하기' });
  await page.waitForTimeout(100);
  if (await add.isEnabled()) await add.click();
}

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

export const STATES = {
  '15': { subjects: FOUR, act: async () => {} },
  '15-E': { subjects: FOUR, act: (p) => openForm(p, '미적분 심화 문제풀이 정리하기', '수학', 'blue', false) },
  '15-D': { subjects: FOUR, act: (p) => openForm(p, '수학 · 미적분', '수학', 'blue', true) },
  '15-M': { subjects: TWENTY, act: (p) => openForm(p, '물리 · 역학', '과학탐구', 'green', true) },
  '15-Z': { subjects: [], act: async () => {} },
};
