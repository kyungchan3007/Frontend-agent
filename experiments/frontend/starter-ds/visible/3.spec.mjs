import { test, expect } from '@playwright/test';
import { mockApi } from '../tools/mock.mjs';

test('계획 추가 시트에 제목과 저장 버튼이 보인다', async ({ page }) => {
  await mockApi(page);
  await page.goto('/plan');
  await expect(page.getByText('계획 추가')).toBeVisible();
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible();
});
