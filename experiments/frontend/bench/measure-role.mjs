// 역할 분담 구조 비교: 동작 확인, 번들, 개발 서버, 함수 시간, 코드 구조
// 실행: node bench/measure-role.mjs
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';
import { ROOT } from './workdir-ds.mjs';
import { install } from './workdir-pkg.mjs';
import { serve } from '../starter/tools/serve.mjs';
import { FOUR, mockApi, nameInput } from '../starter-mod/tools/mock.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const collect = (suite, file) => {
  const f = suite.file ?? file;
  return [...(suite.specs ?? []).map((s) => ({ title: s.title, ok: s.ok, file: f })), ...(suite.suites ?? []).flatMap((x) => collect(x, f))];
};

async function behavior(dir, port) {
  const s = await serve(dir, port);
  const report = path.join(os.tmpdir(), `role-${port}-${Date.now()}.json`);
  spawnSync('npx', ['playwright', 'test', '--config', path.join(ROOT, 'hidden/module/playwright.config.mjs'), '1-sheet', '2-manage', '3-plan'], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, BASE_URL: s.url, REPORT_FILE: report },
  });
  s.stop();
  const specs = JSON.parse(await fs.readFile(report, 'utf8')).suites.flatMap((x) => collect(x));
  return { pass: specs.filter((x) => x.ok).length, total: specs.length, failed: specs.filter((x) => !x.ok).map((x) => x.title) };
}

async function bundle(dir) {
  const r = spawnSync('npx', ['vite', 'build'], { cwd: dir, encoding: 'utf8' });
  const modules = Number((r.stdout + r.stderr).match(/(\d+) modules transformed/)?.[1] ?? 0);
  const assets = path.join(dir, 'dist/assets');
  const js = (await fs.readdir(assets)).filter((f) => f.endsWith('.js'));
  const buffers = await Promise.all(js.map((f) => fs.readFile(path.join(assets, f))));
  return { modules, jsKb: Number((buffers.reduce((n, b) => n + b.length, 0) / 1024).toFixed(1)), gzipKb: Number((buffers.reduce((n, b) => n + gzipSync(b).length, 0) / 1024).toFixed(1)) };
}

// CPU 프로파일에서 함수별 자체 · 총 시간을 모은다
function summarize(profile) {
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  profile.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000));
  const parent = new Map();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const by = {};
  let active = 0;
  for (const [id, ms] of self) {
    const name = nodes.get(id).callFrame.functionName || '(anonymous)';
    if (!['(idle)', '(program)', '(garbage collector)', '(root)'].includes(name)) active += ms;
    (by[name] ??= { self: 0, total: 0 }).self += ms;
    const seen = new Set();
    for (let cur = id; cur != null; cur = parent.get(cur)) {
      const n = nodes.get(cur).callFrame.functionName || '(anonymous)';
      if (seen.has(n)) continue;
      seen.add(n);
      (by[n] ??= { self: 0, total: 0 }).total += ms;
    }
  }
  return { active, by };
}

async function dev(dir) {
  const port = 4500 + Math.floor(Math.random() * 90);
  const child = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 200; i++) {
    try { await fetch(url); break; } catch { await sleep(100); }
  }
  const browser = await chromium.launch();
  const loads = [];
  let requests = null;
  let duplicates = null;
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await mockApi(page, { subjects: FOUR });
    const urls = [];
    page.on('request', (r) => { if (r.url().includes('/src/')) urls.push(r.url()); });
    const t = Date.now();
    await page.goto(`${url}/subjects`);
    await nameInput(page).waitFor({ timeout: 30000 });
    if (i > 0) loads.push(Date.now() - t);
    requests = new Set(urls).size;
    duplicates = urls.length - new Set(urls).size;
    await context.close();
  }

  // 과목 관리 화면에서 이름을 입력하는 동안의 함수 시간
  const runs = [];
  const fns = {};
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await mockApi(page, { subjects: FOUR });
    await page.goto(`${url}/subjects`);
    const input = nameInput(page);
    await input.waitFor({ timeout: 30000 });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
    await cdp.send('Profiler.start');
    for (const ch of '가나다라마바사아자차') await input.pressSequentially(ch);
    const { profile } = await cdp.send('Profiler.stop');
    const s = summarize(profile);
    runs.push(s.active);
    for (const [name, v] of Object.entries(s.by)) {
      if (/^(use[A-Z]|SubjectManager)/.test(name) && !/^use(State|Effect|Memo|Callback|Ref|Reducer|Context|Layout|Insertion|Sync|Transition|Deferred|Id|Debug)/.test(name)) {
        (fns[name] ??= { self: [], total: [] }).self.push(v.self);
        fns[name].total.push(v.total);
      }
    }
    await context.close();
  }
  await browser.close();
  process.kill(-child.pid);
  const named = Object.fromEntries(Object.entries(fns).map(([k, v]) => [k, { selfMs: Number(median(v.self).toFixed(1)), totalMs: Number(median(v.total).toFixed(1)) }]));
  return { firstLoadMs: median(loads), srcRequests: requests, duplicateRequests: duplicates, typingActiveMs: Number(median(runs).toFixed(1)), named };
}

async function structure(dir) {
  const src = path.join(dir, 'src');
  const files = (await fs.readdir(src, { recursive: true })).map(String).filter((f) => /\.(tsx?|jsx?)$/.test(f) && !f.startsWith('ui/') && !/^(main|App)\./.test(f));
  const texts = await Promise.all(files.map(async (f) => [f, await fs.readFile(path.join(src, f), 'utf8')]));
  const importLines = texts.flatMap(([, t]) => t.match(/^import\s.+from\s+['"]\.[^'"]*['"]/gm) ?? []);
  const has = (re) => texts.filter(([, t]) => re.test(t)).map(([f]) => f);
  return {
    files: files.length,
    localImports: importLines.length,
    apiPathFiles: has(/['"`]\/api[/'"`$]/).length,
    fetchFiles: has(/\bfetch\(/).length,
    nameRuleFiles: has(/\b15\b|15자/).length,
    messageFiles: has(/까지 쓸 수 있어요/).length,
    typeFiles: has(/\b(interface|type)\s+[A-Z]/).length,
    pureLogicFiles: texts.filter(([f, t]) => f.endsWith('.ts') && !/from\s+['"]react['"]/.test(t) && /export\s+(const|function)/.test(t) && !/fetch\(/.test(t)).map(([f]) => f),
    list: files,
  };
}

const results = {};
let port = 4400;
for (const shape of ['A', 'B', 'C']) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `fe-role-m-${shape}-`));
  await fs.cp(path.join(ROOT, `starter-role/${shape}`), dir, { recursive: true });
  install(dir);
  const b = await bundle(dir);
  results[shape] = { behavior: await behavior(dir, port++), bundle: b, dev: await dev(dir), structure: await structure(dir) };
  await fs.rm(dir, { recursive: true, force: true });
}
await fs.writeFile(path.join(ROOT, 'results/2026-11-03-role.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
