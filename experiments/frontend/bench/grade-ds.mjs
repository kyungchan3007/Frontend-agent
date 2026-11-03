// 단계별 채점: 숨은 테스트 · 픽셀 차이 · 일관성 · 재사용 · 접근성
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { FOUR, STATES, mockApi } from '../starter-ds/tools/mock.mjs';
import { compare } from '../starter/tools/compare.mjs';
import { serve } from '../starter/tools/serve.mjs';
import { SCREEN, primaryStyle } from '../hidden/ds/probe.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HIDDEN = path.join(ROOT, 'hidden/ds');
export const FILES = { 1: '1-sheet', 2: '2-manage', 3: '3-plan', 4: '4-change' };
const STAGE_STATES = { 1: ['15', '15-E', '15-D', '15-M', '15-Z'], 2: ['16'], 3: ['32'], 4: [] };
const design = (name) => path.join(ROOT, name.startsWith('15') ? 'fixtures/small/screens' : 'fixtures/ds/screens', `${name}.png`);

const collect = (suite, file) => {
  const f = suite.file ?? file;
  return [...(suite.specs ?? []).map((s) => ({ title: s.title, ok: s.ok, file: path.basename(s.file ?? f) })), ...(suite.suites ?? []).flatMap((x) => collect(x, f))];
};

function scan(work) {
  const src = path.join(work, 'src');
  const files = fs.readdirSync(src, { recursive: true }).map(String).filter((f) => /\.(jsx?|css)$/.test(f));
  const texts = files.filter((f) => !f.endsWith('tokens.css')).map((f) => [f, fs.readFileSync(path.join(src, f), 'utf8')]);
  const outside = texts.filter(([f]) => !f.startsWith('ui/'));
  const count = (list, re) => list.reduce((n, [, t]) => n + (t.match(re) ?? []).length, 0);
  const colors = /#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(|hsla?\(/g;
  return {
    offTokenColors: count(texts, colors),
    distinctColors: new Set(texts.flatMap(([, t]) => (t.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((c) => c.toLowerCase()))).size,
    rawButtons: count(outside, /<button\b/g),
    rawInputs: count(outside, /<input\b/g),
    buttonFiles: outside.filter(([, t]) => /<button\b/.test(t)).length,
    chipDefs: count(outside, /(?:function|const)\s+[A-Z]\w*Chip\w*|(?:function|const)\s+Chip\w*/g),
    uiImports: outside.filter(([, t]) => /from\s+['"][^'"]*ui\//.test(t)).length,
    sourceLines: outside.reduce((n, [, t]) => n + t.split('\n').length, 0),
  };
}

async function consistency(browser, url) {
  const styles = {};
  for (const screen of Object.keys(SCREEN)) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await mockApi(page, { subjects: FOUR });
      await page.goto(url + SCREEN[screen]);
      styles[screen] = await primaryStyle(page, screen);
    } catch {
      styles[screen] = null;
    }
    await context.close();
  }
  const list = Object.values(styles).filter(Boolean);
  const distinct = (k) => new Set(list.map((s) => s[k])).size;
  return { styles, found: list.length, differingProps: ['height', 'radius', 'bg'].filter((k) => distinct(k) > 1) };
}

export async function gradeStage(work, outDir, stage, port) {
  fs.mkdirSync(outDir, { recursive: true });
  const built = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: work, encoding: 'utf8' });
  if (built.status !== 0) return { stage, built: false, byFile: {}, failed: [], buildError: built.stderr.slice(-500) };

  const s = await serve(work, port);
  const report = path.join(outDir, 'hidden.json');
  const files = Object.keys(FILES).filter((k) => Number(k) <= stage).map((k) => FILES[k]);
  spawnSync('npx', ['playwright', 'test', '--config', path.join(HIDDEN, 'playwright.config.mjs'), ...files], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, BASE_URL: s.url, REPORT_FILE: report },
  });
  const specs = JSON.parse(fs.readFileSync(report, 'utf8')).suites.flatMap((x) => collect(x));
  const byFile = {};
  for (const [k, name] of Object.entries(FILES)) {
    const own = specs.filter((x) => x.file.startsWith(name));
    if (own.length) byFile[k] = { pass: own.filter((x) => x.ok).length, total: own.length };
  }

  const browser = await chromium.launch();
  const pixels = {};
  for (const name of STAGE_STATES[stage]) {
    const st = STATES[name];
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await mockApi(page, { subjects: st.subjects });
      await page.goto(s.url + st.path);
      await page.waitForLoadState('networkidle');
      await st.act(page);
      await page.waitForTimeout(300);
      const shot = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: shot });
      pixels[name] = Number(compare(design(name), shot, path.join(outDir, `${name}-diff.png`)).toFixed(2));
    } catch {
      pixels[name] = null;
    }
    await context.close();
  }

  const extra = {};
  if (stage >= 3) {
    extra.consistency = await consistency(browser, s.url);
    extra.scan = scan(work);
    const axe = new Set();
    for (const screen of Object.keys(SCREEN)) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      try {
        await mockApi(page, { subjects: FOUR });
        await page.goto(s.url + SCREEN[screen]);
        await page.waitForLoadState('networkidle');
        const Axe = AxeBuilder.default ?? AxeBuilder;
        const res = await new Axe({ page }).analyze();
        for (const v of res.violations) if (['serious', 'critical'].includes(v.impact)) axe.add(`${screen}:${v.id}`);
      } catch {
        axe.add(`${screen}:측정 실패`);
      }
      await context.close();
    }
    extra.axe = [...axe];
  }
  await browser.close();
  s.stop();

  return { stage, built: true, byFile, failed: specs.filter((x) => !x.ok).map((x) => x.title), pixels, ...extra };
}
