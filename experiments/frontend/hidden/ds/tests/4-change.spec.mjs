import { test, expect } from '@playwright/test';
import { FOUR, mockApi } from '../../../starter-ds/tools/mock.mjs';
import { SCREEN, chipBg, primaryStyle } from '../probe.mjs';

const NEW_CHIP = 'rgb(6, 122, 87)';
const SCREENS = ['sheet', 'manage', 'plan'];
const open = async (page, screen) => {
  await mockApi(page, { subjects: FOUR });
  await page.goto(SCREEN[screen]);
};

for (const screen of SCREENS) {
  test(`C1 ${screen} 주 버튼 높이 48`, async ({ page }) => {
    await open(page, screen);
    expect((await primaryStyle(page, screen)).height).toBe(48);
  });
  test(`C2 ${screen} 주 버튼 모서리 18`, async ({ page }) => {
    await open(page, screen);
    expect((await primaryStyle(page, screen)).radius).toBe('18px');
  });
}

test('C3 sheet 선택한 칩 배경', async ({ page }) => {
  await open(page, 'sheet');
  await page.getByRole('button', { name: /새 과목 추가/ }).click();
  await page.getByText('국어', { exact: true }).last().click();
  await expect.poll(() => chipBg(page, '국어')).toBe(NEW_CHIP);
});

test('C3 manage 선택한 칩 배경', async ({ page }) => {
  await open(page, 'manage');
  await page.getByText('과학탐구', { exact: true }).last().click();
  await expect.poll(() => chipBg(page, '과학탐구')).toBe(NEW_CHIP);
});

test('C3 plan 선택한 칩 배경', async ({ page }) => {
  await open(page, 'plan');
  await page.getByText('매일', { exact: true }).click();
  await expect.poll(() => chipBg(page, '매일')).toBe(NEW_CHIP);
});
