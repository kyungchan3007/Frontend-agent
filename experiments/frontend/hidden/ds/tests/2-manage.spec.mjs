import { test, expect } from '@playwright/test';
import { FOUR, S, TWENTY, mockApi, nameInput, pickStandard, pressIfOn } from '../../../starter-ds/tools/mock.mjs';

const ADD = '과목 추가하기';
const STANDARD = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타'];
const COLORS = ['blue', 'cyan', 'amber', 'violet', 'green', 'rose', 'slate'];
const open = async (page, opts) => {
  const calls = await mockApi(page, opts);
  await page.goto('/subjects');
  await nameInput(page).waitFor({ timeout: 5000 });
  return calls;
};

// 글자에서 올라가며 과목 줄을 찾아 내용과 색 점을 읽는다
const readRow = (page, name) => page.getByText(name, { exact: true }).first().evaluate((el) => {
  let row = el;
  while (row.parentElement && row.getBoundingClientRect().height < 40) row = row.parentElement;
  const hasDot = [...row.querySelectorAll('*')].some((e) => {
    const b = e.getBoundingClientRect();
    return b.width >= 4 && b.width <= 24 && b.height >= 4 && b.height <= 24 && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)';
  });
  return { text: row.textContent, hasDot };
});

test('M1 과목 줄에 색 · 이름 · 표준 과목', async ({ page }) => {
  await open(page, { subjects: [S('x', '미적분 오답', '수학', 'blue', 0, '2026-11-01T09:00:00Z')] });
  const r = await readRow(page, '미적분 오답');
  expect(r.text).toContain('수학');
  expect(r.hasDot).toBe(true);
});

test('M2 보관한 과목은 숨기고 개수를 보여 준다', async ({ page }) => {
  await open(page, { subjects: [...FOUR, S('a1', '보관 하나', '기타', 'slate', 0, null, true), S('a2', '보관 둘', '기타', 'slate', 0, null, true)] });
  await expect(page.getByText('보관한 과목 2개')).toBeVisible();
  await expect(page.getByText('보관 하나')).toHaveCount(0);
});

test('M3 이름 16자는 추가되지 않는다', async ({ page }) => {
  const calls = await open(page);
  await nameInput(page).fill('가'.repeat(16));
  await pickStandard(page, '수학');
  await pressIfOn(page, ADD);
  expect(calls.subjects).toEqual([]);
});

test('M4 같은 이름은 추가되지 않는다', async ({ page }) => {
  await open(page);
  await nameInput(page).fill('수학 · 미적분');
  await pickStandard(page, '수학');
  await pressIfOn(page, ADD);
  await page.waitForTimeout(200);
  await expect(page.getByText('수학 · 미적분', { exact: true })).toHaveCount(1);
});

test('M5 표준 과목 8개가 순서대로', async ({ page }) => {
  await open(page);
  let last = { y: -1, x: -1 };
  for (const t of STANDARD) {
    const b = await page.getByText(t, { exact: true }).last().boundingBox();
    expect(b.y > last.y + 5 || (Math.abs(b.y - last.y) <= 5 && b.x > last.x)).toBe(true);
    last = b;
  }
});

test('M6 표준 과목을 안 고르면 추가되지 않는다', async ({ page }) => {
  const calls = await open(page);
  await nameInput(page).fill('물리 · 역학');
  await pressIfOn(page, ADD);
  expect(calls.subjects).toEqual([]);
});

test('M7 색 7개를 고를 수 있다', async ({ page }) => {
  await open(page);
  for (const c of COLORS) await expect(page.locator(`[aria-label="${c}"]`)).toBeVisible();
});

test('M8 이름 · 표준 과목 · 색으로 요청한다', async ({ page }) => {
  const calls = await open(page);
  await nameInput(page).fill('물리 · 역학');
  await pickStandard(page, '과학탐구');
  await page.locator('[aria-label="green"]').click();
  await page.getByRole('button', { name: ADD }).click();
  await expect.poll(() => calls.subjects).toEqual([{ name: '물리 · 역학', standardSubject: '과학탐구', color: 'green' }]);
});

test('M9 추가하면 목록에 보인다', async ({ page }) => {
  await open(page);
  await nameInput(page).fill('물리 · 역학');
  await pickStandard(page, '과학탐구');
  await page.getByRole('button', { name: ADD }).click();
  await expect(page.getByText('물리 · 역학', { exact: true })).toBeVisible();
});

test('M10 과목이 20개면 추가되지 않는다', async ({ page }) => {
  await open(page, { subjects: TWENTY });
  await nameInput(page).fill('물리 · 역학');
  await pickStandard(page, '과학탐구');
  await pressIfOn(page, ADD);
  await page.waitForTimeout(200);
  await expect(page.getByText('물리 · 역학', { exact: true })).toHaveCount(0);
});
