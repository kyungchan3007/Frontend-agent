// 개발자 입장 측정: 같은 앱을 앱 안 구조와 패키지 구조로 놓고 직접 잰다
// 실행: node bench/measure-pkg.mjs
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT } from './workdir-ds.mjs';
import { appDir, diffStat, snapshot } from './workdir-pkg.mjs';
import { FOUR, mockApi } from '../starter-mod/tools/mock.mjs';

const REF = path.join(ROOT, 'hidden/module/reference');
const SCREENS = ['SubjectSheet.jsx', 'SubjectManager.jsx', 'PlanSheet.jsx'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const timed = (cmd, args, cwd) => {
  const t = Date.now();
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  return { ms: Date.now() - t, ok: r.status === 0, err: (r.stderr + r.stdout).slice(-400) };
};
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

async function makeApp() {
  const dir = await appDir('fe-measure-app-');
  for (const f of SCREENS) await fs.cp(path.join(REF, f), path.join(dir, 'src', f));
  return dir;
}

async function makePackages() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-measure-pkg-'));
  await fs.cp(path.join(ROOT, 'starter-pkg/template'), dir, { recursive: true });
  for (const f of SCREENS) {
    const t = await fs.readFile(path.join(REF, f), 'utf8');
    await fs.writeFile(path.join(dir, 'src', f), t.replaceAll("'./ui/index.js'", "'@app/ui'").replaceAll("'./shared/index.js'", "'@app/shared'"));
  }
  return dir;
}

// 개발 서버를 띄우고 버튼 파일을 고쳤을 때 새로고침 없이 반영되는지 잰다
async function devLoop(dir, buttonFile) {
  const port = 4600 + Math.floor(Math.random() * 90);
  const t = Date.now();
  const child = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 120; i++) {
    try { await fetch(url); break; } catch { await sleep(100); }
  }
  const startMs = Date.now() - t;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mockApi(page, { subjects: FOUR });
  await page.goto(url);
  const button = page.getByRole('button', { name: /측정 시작$/ });
  await button.waitFor({ timeout: 30000 });
  await page.evaluate(() => { window.__kept = true; });
  const before = await button.evaluate((e) => e.getBoundingClientRect().height);
  const file = path.join(dir, buttonFile);
  const src = await fs.readFile(file, 'utf8');
  const edited = Date.now();
  await fs.writeFile(file, src.replace("L: 'h-13 px-6", "L: 'h-12 px-6"));
  let after = before;
  for (let i = 0; i < 100 && after === before; i++) {
    await sleep(50);
    after = await button.evaluate((e) => e.getBoundingClientRect().height).catch(() => before);
  }
  const reflectMs = Date.now() - edited;
  const noReload = await page.evaluate(() => window.__kept === true);
  await fs.writeFile(file, src);
  await browser.close();
  process.kill(-child.pid);
  return { startMs, before, after, reflectMs, noReload };
}

async function measure(name, dir, buttonFile) {
  const install = timed('npm', ['install', '--no-audit', '--no-fund', '--prefer-offline'], dir);
  const builds = [];
  for (let i = 0; i < 3; i++) builds.push(timed('npx', ['vite', 'build', '--logLevel', 'error'], dir).ms);
  const dev = await devLoop(dir, buttonFile);
  return { name, installMs: install.ms, installOk: install.ok, buildMs: median(builds), dev };
}

const app = await makeApp();
const pkg = await makePackages();
const results = [await measure('앱 안', app, 'src/ui/Button.jsx'), await measure('패키지', pkg, 'packages/ui/Button.jsx')];

// 옮길 때 건드리는 것
const a = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-measure-a-'));
const b = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-measure-b-'));
await snapshot(app, a);
await snapshot(pkg, b);
const count = async (d) => (await fs.readdir(d, { recursive: true, withFileTypes: true })).filter((e) => e.isFile()).length;
const screensChanged = (await Promise.all(SCREENS.map(async (f) => (await fs.readFile(path.join(a, 'src', f), 'utf8')) !== (await fs.readFile(path.join(b, 'src', f), 'utf8'))))).filter(Boolean).length;
const migration = {
  totalChangedFiles: diffStat(a, b),
  movedFiles: (await count(path.join(a, 'src/ui'))) + (await count(path.join(a, 'src/shared'))),
  screensChanged,
  newPackageJson: 2,
  configChanged: ['package.json', 'src/index.css'],
};

// 실수했을 때의 증상
const pit = {};
const css = async (d) => {
  const assets = path.join(d, 'dist/assets');
  const f = (await fs.readdir(assets)).find((x) => x.endsWith('.css'));
  return fs.readFile(path.join(assets, f), 'utf8');
};
timed('npx', ['vite', 'build', '--logLevel', 'error'], pkg);
const withSource = await css(pkg);
const indexCss = path.join(pkg, 'src/index.css');
const originalCss = await fs.readFile(indexCss, 'utf8');
await fs.writeFile(indexCss, originalCss.replace(/@source[^\n]*\n/g, ''));
const noSourceBuild = timed('npx', ['vite', 'build', '--logLevel', 'error'], pkg);
const withoutSource = await css(pkg);
const buttonClass = (c) => /\.h-13\b/.test(c);
pit.withoutSource = { buildOk: noSourceBuild.ok, hasButtonClassBefore: buttonClass(withSource), hasButtonClassAfter: buttonClass(withoutSource) };
await fs.writeFile(indexCss, originalCss);

const link = path.join(pkg, 'node_modules/@app/ui');
await fs.rm(link, { recursive: true, force: true });
const noLink = timed('npx', ['vite', 'build', '--logLevel', 'error'], pkg);
pit.withoutInstall = { buildOk: noLink.ok, error: noLink.err.split('\n').find((l) => /@app\/ui/.test(l))?.trim() ?? noLink.err.slice(-200) };

const output = { results, migration, pit, setupRun: JSON.parse(await fs.readFile(path.join(ROOT, 'starter-pkg/setup.json'), 'utf8')) };
delete output.setupRun.costUsd;
await fs.writeFile(path.join(ROOT, 'results/2026-11-03-pkg.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
for (const d of [app, pkg, a, b]) await fs.rm(d, { recursive: true, force: true });
