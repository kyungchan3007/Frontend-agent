import { test, expect } from '@playwright/test';
import { mockApi, pressIfOn } from '../../../starter-ds/tools/mock.mjs';

const SAVE = '저장하기';
const OVERLAP = '겹치는 계획이 있어요';
const start = (p) => p.getByLabel('시작', { exact: true });
const end = (p) => p.getByLabel('종료', { exact: true });
const open = async (page, opts) => {
  const calls = await mockApi(page, opts);
  await page.goto('/plan');
  await page.getByRole('button', { name: SAVE }).waitFor({ timeout: 5000 });
  return calls;
};

test('P1 제목은 계획 추가', async ({ page }) => {
  await open(page);
  await expect(page.getByText('계획 추가', { exact: true })).toBeVisible();
});

test('P2 과목 줄을 누르면 목록이 열리고 고르면 반영된다', async ({ page }) => {
  await open(page);
  await page.getByText('수학 · 미적분').click();
  await page.getByText('영어 · 독해').click();
  await expect(page.getByText('국어 · 문학')).toHaveCount(0);
  await expect(page.getByText('영어 · 독해')).toBeVisible();
});

test('P3 시작 · 종료 칸과 처음 값', async ({ page }) => {
  await open(page);
  await expect(start(page)).toHaveValue('19:00');
  await expect(end(page)).toHaveValue('21:00');
});

test('P4 종료가 시작보다 빠르면 저장되지 않는다', async ({ page }) => {
  const calls = await open(page);
  await end(page).fill('18:00');
  await pressIfOn(page, SAVE);
  expect(calls.plans).toEqual([]);
});

test('P5 겹치면 안내하지만 저장할 수 있다', async ({ page }) => {
  const calls = await open(page, { plans: [{ id: 'p', subjectId: 'kor', start: '20:00', end: '22:00', repeat: 'none', notify: false }] });
  await expect(page.getByText(OVERLAP)).toBeVisible();
  await start(page).fill('22:00');
  await end(page).fill('23:00');
  await expect(page.getByText(OVERLAP)).toHaveCount(0);
  await start(page).fill('19:00');
  await end(page).fill('21:00');
  await page.getByRole('button', { name: SAVE }).click();
  await expect.poll(() => calls.plans.length).toBe(1);
});

test('P6 반복 칩 4개가 순서대로', async ({ page }) => {
  await open(page);
  let last = -1;
  for (const t of ['안 함', '매일', '평일', '요일 선택']) {
    const b = await page.getByText(t, { exact: true }).boundingBox();
    expect(b.x).toBeGreaterThan(last);
    last = b.x;
  }
});

test('P7 알림을 켜고 끈다', async ({ page }) => {
  await open(page);
  const sw = page.getByRole('switch');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
});

test('P8 딱지 안내 문구', async ({ page }) => {
  await open(page);
  await expect(page.getByText(/시작 30분이 지나도 측정하지 않으면 경고 딱지가 쌓여요/)).toBeVisible();
});

test('P9 과목 · 시간 · 반복 · 알림으로 요청한다', async ({ page }) => {
  const calls = await open(page);
  await page.getByText('매일', { exact: true }).click();
  await page.getByRole('switch').click();
  await page.getByRole('button', { name: SAVE }).click();
  await expect.poll(() => calls.plans).toEqual([{ subjectId: 'mat', start: '19:00', end: '21:00', repeat: 'daily', notify: false }]);
});
