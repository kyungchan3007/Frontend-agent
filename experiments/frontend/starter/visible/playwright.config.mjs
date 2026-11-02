import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 15000,
  use: { baseURL: process.env.BASE_URL, viewport: { width: 390, height: 844 } },
});
