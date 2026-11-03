import { test, expect } from '@playwright/test';
import { FOUR, mockApi, nameInput } from '../tools/mock.mjs';

test('마지막 공부 과목이 선택된다', async ({ page }) => {
  await mockApi(page, { subjects: FOUR });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '수학 · 미적분 측정 시작' })).toBeVisible();
});

test('16자면 오류가 보이고 추가가 꺼진다', async ({ page }) => {
  await mockApi(page, { subjects: FOUR });
  await page.goto('/');
  await page.getByRole('button', { name: /새 과목 추가/ }).click();
  await nameInput(page).fill('가'.repeat(16));
  await expect(page.getByText('이름은 15자까지 쓸 수 있어요. 조금 줄여 주세요')).toBeVisible();
  await expect(page.getByRole('button', { name: '추가하기' })).toBeDisabled();
});

test('과목 0개면 추천 칩이 보인다', async ({ page }) => {
  await mockApi(page, { subjects: [] });
  await page.goto('/');
  await expect(page.getByText('아직 과목이 없어요')).toBeVisible();
});
