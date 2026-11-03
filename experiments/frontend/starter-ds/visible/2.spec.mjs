import { test, expect } from '@playwright/test';
import { mockApi } from '../tools/mock.mjs';

test('과목 관리에 내 과목과 추가 버튼이 보인다', async ({ page }) => {
  await mockApi(page);
  await page.goto('/subjects');
  await expect(page.getByText('수학 · 미적분')).toBeVisible();
  await expect(page.getByRole('button', { name: '과목 추가하기' })).toBeVisible();
});
