import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 15000,
  workers: 4,
  reporter: [['json', { outputFile: process.env.REPORT_FILE }]],
  use: { baseURL: process.env.BASE_URL, viewport: { width: 390, height: 844 } },
});
