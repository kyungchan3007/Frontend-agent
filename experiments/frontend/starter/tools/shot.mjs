// 브라우저 확인: 상태별 화면을 찍어 시안과 비교한다. 결과는 .shots/
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { STATES, mockApi } from './mock.mjs';
import { compare } from './compare.mjs';
import { serve } from './serve.mjs';

fs.mkdirSync('.shots', { recursive: true });
if (spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { stdio: 'inherit' }).status !== 0) process.exit(1);
const s = await serve('.', 5000 + Math.floor(Math.random() * 3000));
const browser = await chromium.launch();
for (const [name, st] of Object.entries(STATES)) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await mockApi(page, { subjects: st.subjects });
    await page.goto(s.url);
    await page.waitForLoadState('networkidle');
    await st.act(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `.shots/${name}.png` });
    const pct = compare(`screens/${name}.png`, `.shots/${name}.png`, `.shots/${name}-diff.png`);
    console.log(`${name}: 차이 ${pct.toFixed(2)}%  화면 .shots/${name}.png  차이 .shots/${name}-diff.png`);
  } catch (e) {
    console.log(`${name}: 상태를 만들지 못함 (${e.message.split('\n')[0]})`);
  }
  await page.close();
}
await browser.close();
s.stop();
