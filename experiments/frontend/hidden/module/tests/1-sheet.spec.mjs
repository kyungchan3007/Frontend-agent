import { test, expect } from '@playwright/test';
import { FOUR, S, TWENTY, mockApi, nameInput, pickStandard, pressAdd } from '../../../starter-mod/tools/mock.mjs';

const start = (p) => p.getByRole('button', { name: /측정 시작$/ });
const add = (p) => p.getByRole('button', { name: '추가하기' });
const openForm = (p) => p.getByRole('button', { name: /새 과목 추가/ }).click();
const MAX = Number(process.env.NAME_MAX ?? 15);
const TOO_LONG = `이름은 ${MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`;
const SAME = '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요';
const LIMIT = '과목은 20개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요';
const OFFLINE_TOAST = '인터넷 연결을 확인해 주세요';
const OFFLINE_BANNER = '인터넷 연결이 없어요';

async function fillForm(page, name) {
  await openForm(page);
  await nameInput(page).fill(name);
  await pickStandard(page, '수학');
  await page.locator('[aria-label="green"]').click();
}

async function expectBelowInput(page, text) {
  const err = page.getByText(text);
  await expect(err).toBeVisible();
  const a = await nameInput(page).boundingBox();
  const b = await err.boundingBox();
  expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
  expect(b.y - (a.y + a.height)).toBeLessThan(60);
}

test.describe('기본', () => {
  test('S1 마지막 공부 과목이 선택된다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(start(page)).toHaveText(/수학 · 미적분 측정 시작/);
  });
  test('S2 최근 사용 순으로 놓인다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(start(page)).toBeVisible();
    const y = async (t) => (await page.getByText(t, { exact: true }).first().boundingBox()).y;
    const [m, e, k, h] = [await y('수학 · 미적분'), await y('영어 · 독해'), await y('국어 · 문학'), await y('한국사')];
    expect(m).toBeLessThan(e);
    expect(e).toBeLessThan(k);
    expect(k).toBeLessThan(h);
  });
  test('S3 보관한 과목은 숨긴다', async ({ page }) => {
    await mockApi(page, { subjects: [...FOUR, S('old', '보관 과목', '기타', 'slate', 0, '2026-11-02T09:00:00Z', true)] });
    await page.goto('/');
    await expect(start(page)).toHaveText(/수학 · 미적분/);
    await expect(page.getByText('보관 과목')).toHaveCount(0);
  });
  test('S4 표준 과목과 오늘 시간을 보여 준다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByText('표준 과목 · 수학')).toBeVisible();
    await expect(page.getByText('오늘 2:10')).toBeVisible();
    await expect(page.getByText('오늘 0:00')).toBeVisible();
  });
  test('S5 다른 과목을 누르면 버튼이 바뀐다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByText('영어 · 독해', { exact: true }).click();
    await expect(start(page)).toHaveText(/영어 · 독해 측정 시작/);
  });
  test('S6 시작하면 세션을 만들고 이동한다', async ({ page }) => {
    const calls = await mockApi(page);
    await page.goto('/');
    await start(page).click();
    await page.waitForURL('**/timer/sess1');
    expect(calls.sessions).toEqual([{ subjectId: 'mat' }]);
  });
  test('S7 과목 관리로 이동한다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByText(/과목 관리/).click();
    await page.waitForURL('**/subjects');
  });
});

test.describe('이름 길이', () => {
  test('E1 최대 길이는 괜찮다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await fillForm(page, '가'.repeat(MAX));
    await expect(page.getByText(TOO_LONG)).toHaveCount(0);
    await expect(add(page)).toBeEnabled();
  });
  test('E2 넘치면 칸 아래 오류와 글자 수', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await fillForm(page, '가'.repeat(MAX + 1));
    await expectBelowInput(page, TOO_LONG);
    await expect(page.getByText(`${MAX + 1}/${MAX}`)).toBeVisible();
    await expect(add(page)).toBeDisabled();
  });
  test('E3 줄이면 다시 켜진다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await fillForm(page, '가'.repeat(MAX + 1));
    await nameInput(page).fill('가'.repeat(MAX));
    await expect(page.getByText(TOO_LONG)).toHaveCount(0);
    await expect(add(page)).toBeEnabled();
  });
});

test.describe('폼 모양', () => {
  test('F1 표준 과목은 누르는 칩으로 보인다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await openForm(page);
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '제2외국어', exact: true })).toBeVisible();
  });
});

test.describe('같은 이름', () => {
  test('D1 있는 이름으로 추가하면 오류', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await fillForm(page, '수학 · 미적분');
    await pressAdd(page);
    await expectBelowInput(page, SAME);
    await expect(add(page)).toBeDisabled();
  });
  test('D2 이름을 바꾸면 다시 켜진다', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await fillForm(page, '수학 · 미적분');
    await pressAdd(page);
    await nameInput(page).fill('수학 · 기하');
    await expect(page.getByText(SAME)).toHaveCount(0);
    await expect(add(page)).toBeEnabled();
  });
  test('D3 서버 409도 같은 문구', async ({ page }) => {
    await mockApi(page, { createSubject: (r, json) => json(r, 409, { code: 'SUBJECT_NAME_TAKEN' }) });
    await page.goto('/');
    await fillForm(page, '물리');
    await pressAdd(page);
    await expectBelowInput(page, SAME);
  });
});

test.describe('개수 제한', () => {
  test('M1 20개면 추가할 때 오류', async ({ page }) => {
    await mockApi(page, { subjects: TWENTY });
    await page.goto('/');
    await fillForm(page, '물리');
    await pressAdd(page);
    await expectBelowInput(page, LIMIT);
    await expect(add(page)).toBeDisabled();
  });
  test('M2 서버 409도 같은 문구', async ({ page }) => {
    await mockApi(page, { createSubject: (r, json) => json(r, 409, { code: 'SUBJECT_LIMIT' }) });
    await page.goto('/');
    await fillForm(page, '물리');
    await pressAdd(page);
    await expectBelowInput(page, LIMIT);
  });
});

test.describe('과목 0개', () => {
  test('Z1 안내 문구', async ({ page }) => {
    await mockApi(page, { subjects: [] });
    await page.goto('/');
    await expect(page.getByText('아직 과목이 없어요')).toBeVisible();
    await expect(page.getByText('표준 과목을 누르면 바로 측정을 시작해요')).toBeVisible();
  });
  test('Z2 추천 칩 8개가 순서대로', async ({ page }) => {
    await mockApi(page, { subjects: [] });
    await page.goto('/');
    await expect(page.getByText('아직 과목이 없어요')).toBeVisible();
    let last = { y: -1, x: -1 };
    for (const t of ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타']) {
      const b = await page.getByRole('button', { name: t, exact: true }).boundingBox();
      expect(b.y > last.y + 5 || (Math.abs(b.y - last.y) <= 5 && b.x > last.x)).toBe(true);
      last = b;
    }
  });
  test('Z3 칩을 누르면 파란 과목을 만들고 시작', async ({ page }) => {
    const calls = await mockApi(page, { subjects: [] });
    await page.goto('/');
    await page.getByRole('button', { name: '수학', exact: true }).click();
    await page.waitForURL('**/timer/sess1');
    expect(calls.subjects).toEqual([{ name: '수학', standardSubject: '수학', color: 'blue' }]);
    expect(calls.sessions).toEqual([{ subjectId: 'new' }]);
  });
  test('Z4 새 과목 추가로 폼이 열린다', async ({ page }) => {
    await mockApi(page, { subjects: [] });
    await page.goto('/');
    await openForm(page);
    await expect(nameInput(page)).toBeVisible();
  });
});

test.describe('오프라인', () => {
  test('O1 배너가 보인다', async ({ page, context }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(start(page)).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByText(OFFLINE_BANNER)).toBeVisible();
  });
  test('O2 시작하면 토스트, 이동 없음', async ({ page, context }) => {
    const calls = await mockApi(page);
    await page.goto('/');
    await expect(start(page)).toBeVisible();
    await context.setOffline(true);
    await start(page).click();
    await expect(page.getByText(OFFLINE_TOAST)).toBeVisible();
    await expect(page.getByText(OFFLINE_BANNER)).toBeVisible();
    expect(calls.sessions).toEqual([]);
    expect(new URL(page.url()).pathname).toBe('/');
  });
  test('O3 칩도 토스트, 요청 없음', async ({ page, context }) => {
    const calls = await mockApi(page, { subjects: [] });
    await page.goto('/');
    await expect(page.getByText('아직 과목이 없어요')).toBeVisible();
    await context.setOffline(true);
    await page.getByRole('button', { name: '수학', exact: true }).click();
    await expect(page.getByText(OFFLINE_TOAST)).toBeVisible();
    expect(calls.subjects).toEqual([]);
  });
});

test.describe('이미 측정 중', () => {
  test('R1 서버 409면 진행 중 세션으로', async ({ page }) => {
    await mockApi(page, { startSession: (r, json) => json(r, 409, { code: 'SESSION_ALREADY_RUNNING', sessionId: 'running' }) });
    await page.goto('/');
    await start(page).click();
    await page.waitForURL('**/timer/running');
  });
  test('R2 측정 중에 열면 바꾸기 버튼', async ({ page }) => {
    await mockApi(page, { session: { id: 'running', subjectId: 'eng' } });
    await page.goto('/');
    await expect(page.getByRole('button', { name: '이 과목으로 바꾸기' })).toBeVisible();
  });
});
