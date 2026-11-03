import { test, expect } from '@playwright/test';
import { FOUR, mockApi, nameInput, pickStandard, pressIfOn } from '../../../starter-mod/tools/mock.mjs';

const TOO_LONG = '이름은 12자까지 쓸 수 있어요. 조금 줄여 주세요';
const OLD = '이름은 15자까지 쓸 수 있어요. 조금 줄여 주세요';
const add = (p) => p.getByRole('button', { name: '추가하기', exact: true });
const openSheetForm = async (page) => {
  await mockApi(page, { subjects: FOUR });
  await page.goto('/');
  await page.getByRole('button', { name: /새 과목 추가/ }).click();
  await nameInput(page).waitFor();
};
const openManage = async (page) => {
  const calls = await mockApi(page, { subjects: FOUR });
  await page.goto('/subjects');
  await nameInput(page).waitFor();
  return calls;
};

test('R1 시트: 12자는 괜찮다', async ({ page }) => {
  await openSheetForm(page);
  await nameInput(page).fill('가'.repeat(12));
  await expect(page.getByText(TOO_LONG)).toHaveCount(0);
  await expect(add(page)).toBeEnabled();
});

test('R2 시트: 13자는 새 문구와 13/12', async ({ page }) => {
  await openSheetForm(page);
  await nameInput(page).fill('가'.repeat(13));
  await expect(page.getByText(TOO_LONG)).toBeVisible();
  await expect(page.getByText('13/12')).toBeVisible();
  await expect(page.getByText(OLD)).toHaveCount(0);
  await expect(add(page)).toBeDisabled();
});

test('R3 시트: 줄이면 오류가 사라진다', async ({ page }) => {
  await openSheetForm(page);
  await nameInput(page).fill('가'.repeat(13));
  await nameInput(page).fill('가'.repeat(12));
  await expect(page.getByText(TOO_LONG)).toHaveCount(0);
});

test('R4 과목 관리: 12자는 추가된다', async ({ page }) => {
  const calls = await openManage(page);
  await nameInput(page).fill('나'.repeat(12));
  await pickStandard(page, '수학');
  await page.getByRole('button', { name: '과목 추가하기' }).click();
  await expect.poll(() => calls.subjects.length).toBe(1);
});

test('R5 과목 관리: 13자는 추가되지 않는다', async ({ page }) => {
  const calls = await openManage(page);
  await nameInput(page).fill('나'.repeat(13));
  await pickStandard(page, '수학');
  await pressIfOn(page, '과목 추가하기');
  expect(calls.subjects).toEqual([]);
});
