// 채점: 숨은 테스트 · 픽셀 차이 · 토큰 · 접근성
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STATES, mockApi } from '../starter/tools/mock.mjs';
import { compare } from '../starter/tools/compare.mjs';
import { serve } from '../starter/tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HIDDEN = path.join(ROOT, 'hidden/small');
const DESIGN = path.join(ROOT, 'fixtures/small/screens');

const walk = (spec) => spec.suites?.flatMap(walk).concat(spec.specs ?? []) ?? spec.specs ?? [];

export async function grade(work, outDir, port) {
  fs.mkdirSync(outDir, { recursive: true });
  const built = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: work, encoding: 'utf8' });
  if (built.status !== 0) return { built: false, pass: 0, total: 0, failed: [], buildError: built.stderr.slice(-500) };

  const s = await serve(work, port);
  const report = path.join(outDir, 'hidden.json');
  spawnSync('npx', ['playwright', 'test', '--config', path.join(HIDDEN, 'playwright.config.mjs')], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, BASE_URL: s.url, REPORT_FILE: report },
  });
  const r = JSON.parse(fs.readFileSync(report, 'utf8'));
  const specs = r.suites.flatMap(walk);
  const failed = specs.filter((x) => !x.ok).map((x) => x.title);

  const browser = await chromium.launch();
  const pixels = {};
  let axe = null;
  for (const [name, st] of Object.entries(STATES)) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await mockApi(page, { subjects: st.subjects });
      await page.goto(s.url);
      await page.waitForLoadState('networkidle');
      await st.act(page);
      await page.waitForTimeout(300);
      const shot = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: shot });
      pixels[name] = Number(compare(path.join(DESIGN, `${name}.png`), shot, path.join(outDir, `${name}-diff.png`)).toFixed(2));
      if (name === '15') {
        const Axe = AxeBuilder.default ?? AxeBuilder;
        const res = await new Axe({ page }).analyze();
        axe = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id);
      }
    } catch {
      pixels[name] = null;
    }
    await context.close();
  }
  await browser.close();
  s.stop();

  const hex = fs.readdirSync(path.join(work, 'src'), { recursive: true })
    .filter((f) => /\.(jsx?|css)$/.test(f) && !f.endsWith('tokens.css'))
    .flatMap((f) => fs.readFileSync(path.join(work, 'src', f), 'utf8').match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length;

  const vals = Object.values(pixels);
  return {
    built: true, pass: specs.length - failed.length, total: specs.length, failed, pixels,
    pixelAvg: vals.includes(null) ? null : Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
    statesMissing: vals.filter((v) => v === null).length, hex, axe,
  };
}

// 직접 실행: node bench/grade.mjs <작업 폴더> <결과 폴더>
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await grade(process.argv[2], process.argv[3], 4900), null, 2));
}
