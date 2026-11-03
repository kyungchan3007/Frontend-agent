// 가상의 팀 장면을 설계마다 돌리고 변경분을 남긴다
// 실행: node bench/run-scenes.mjs 1 2 3 4 5   (인자 없이 실행하면 설계 앱만 확인)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { addTools, TOOLS } from './make-design.mjs';
import { ROOT, claude, summarize } from './workdir-ds.mjs';
import { assertSubscription, install } from './workdir-pkg.mjs';
import { serve } from '../starter/tools/serve.mjs';

assertSubscription();
const DESIGNS = (process.env.ONLY ?? 'A,B,C').split(',');
const RESULT = path.join(ROOT, 'results/2026-11-03-design.json');
const CODE = path.join(ROOT, 'results/design-code');
const WITH_SHAPE = '# 작업 안내\n\n- 작업: TASK.md, 설계: SHAPE.md\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx` · `npm`으로 바로 실행한다\n- 파일을 지울 때는 `rm`을 쓴다\n';
const NO_SHAPE = '# 작업 안내\n\n- 작업: TASK.md\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx` · `npm`으로 바로 실행한다\n- 파일을 지울 때는 `rm`을 쓴다\n';
const PROMPT = 'TASK.md의 작업을 하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.';
const git = (cwd, ...args) => spawnSync('git', ['-c', 'user.name=bench', '-c', 'user.email=bench@example.invalid', ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
let port = 4400;

const collect = (suite, file) => {
  const f = suite.file ?? file;
  return [...(suite.specs ?? []).map((s) => ({ title: s.title, ok: s.ok, file: f })), ...(suite.suites ?? []).flatMap((x) => collect(x, f))];
};

// 화면이 깨졌는지만 본다
async function behavior(dir, patterns) {
  const build = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: dir, encoding: 'utf8' });
  if (build.status !== 0) return { built: false, error: build.stderr.slice(-500) };
  const s = await serve(dir, port++);
  const report = path.join(os.tmpdir(), `design-${s.url.split(':').pop()}-${Date.now()}.json`);
  spawnSync('npx', ['playwright', 'test', '--config', path.join(ROOT, 'hidden/module/playwright.config.mjs'), ...patterns], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, BASE_URL: s.url, REPORT_FILE: report },
  });
  s.stop();
  const specs = JSON.parse(await fs.readFile(report, 'utf8')).suites.flatMap((x) => collect(x));
  return { built: true, pass: specs.filter((x) => x.ok).length, total: specs.length, failed: specs.filter((x) => !x.ok).map((x) => x.title) };
}

// 설계 앱을 커밋해 둔 작업 폴더를 만든다
async function base(design, specs) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `fe-scene-${design}-`));
  await fs.cp(path.join(ROOT, `starter-design/${design}`), dir, { recursive: true });
  await addTools(dir, specs);
  await fs.writeFile(path.join(dir, '.gitignore'), 'node_modules\ndist\n.gate-tries\ntest-results\npackage-lock.json\nCLAUDE.md\nTASK.md\n');
  git(dir, 'init', '-q');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');
  return dir;
}

async function work(dir, task, claudeMd) {
  await fs.cp(path.join(ROOT, `task/design/${task}.md`), path.join(dir, 'TASK.md'));
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), claudeMd);
  install(dir);
  const r = await claude(dir, PROMPT, TOOLS);
  const s = summarize(r.out);
  await fs.mkdir(path.join(ROOT, 'runs'), { recursive: true });
  await fs.writeFile(path.join(ROOT, `runs/design-${path.basename(dir)}-${task}.jsonl`), r.out);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', task);
  const files = git(dir, 'diff', '--name-status', 'HEAD~1', 'HEAD').stdout.trim().split('\n').filter(Boolean);
  const diff = git(dir, 'diff', 'HEAD~1', 'HEAD').stdout;
  return { isError: s.isError, gateRuns: s.gateRuns, turns: s.turns, denials: s.permissionDenials, files, diff };
}

async function save(design, name, diff) {
  await fs.mkdir(path.join(CODE, design), { recursive: true });
  await fs.writeFile(path.join(CODE, design, `${name}.diff`), diff);
}

async function single(design, scene) {
  const specs = scene === 5 ? [1, 2] : [1, 2, 3];
  const patterns = scene === 5 ? ['1-sheet', '2-manage'] : ['1-sheet', '2-manage', '3-plan'];
  const dir = await base(design, specs);
  const { diff, ...r } = await work(dir, `scene-${scene}`, scene === 4 ? NO_SHAPE : WITH_SHAPE);
  await save(design, `scene-${scene}`, diff);
  const result = { ...r, behavior: await behavior(dir, patterns) };
  await fs.rm(dir, { recursive: true, force: true });
  return result;
}

// 두 사람이 같은 시작점에서 작업하고 병합한다
async function concurrent(design) {
  const origin = await base(design, [1, 2, 3]);
  const x = await fs.mkdtemp(path.join(os.tmpdir(), `fe-scene-${design}-x-`));
  const y = await fs.mkdtemp(path.join(os.tmpdir(), `fe-scene-${design}-y-`));
  git(os.tmpdir(), 'clone', '-q', origin, x);
  git(os.tmpdir(), 'clone', '-q', origin, y);
  const [rx, ry] = await Promise.all([work(x, 'scene-3x', WITH_SHAPE), work(y, 'scene-3y', WITH_SHAPE)]);
  await save(design, 'scene-3x', rx.diff);
  await save(design, 'scene-3y', ry.diff);
  git(x, 'fetch', '-q', y, 'HEAD');
  const merged = git(x, 'merge', '--no-edit', 'FETCH_HEAD');
  const conflicts = git(x, 'diff', '--name-only', '--diff-filter=U').stdout.trim().split('\n').filter(Boolean);
  let conflictText = '';
  for (const f of conflicts) conflictText += `--- ${f}\n${await fs.readFile(path.join(x, f), 'utf8')}\n`;
  if (conflictText) await save(design, 'scene-3-conflict', conflictText);
  const result = {
    x: { isError: rx.isError, gateRuns: rx.gateRuns, turns: rx.turns, files: rx.files },
    y: { isError: ry.isError, gateRuns: ry.gateRuns, turns: ry.turns, files: ry.files },
    mergeOk: merged.status === 0,
    conflicts,
    behavior: merged.status === 0 ? await behavior(x, ['1-sheet', '2-manage', '3-plan']) : null,
  };
  for (const d of [origin, x, y]) await fs.rm(d, { recursive: true, force: true });
  return result;
}

const load = async () => JSON.parse(await fs.readFile(RESULT, 'utf8').catch(() => '{}'));
const scenes = process.argv.slice(2).map(Number);

if (scenes.length === 0) {
  const results = await load();
  for (const design of DESIGNS) {
    const dir = await base(design, [1, 2, 3]);
    install(dir);
    (results.start ??= {})[design] = await behavior(dir, ['1-sheet', '2-manage', '3-plan']);
    await fs.rm(dir, { recursive: true, force: true });
  }
  await fs.writeFile(RESULT, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results.start, null, 2));
}

for (const scene of scenes) {
  const done = await Promise.all(DESIGNS.map((d) => (scene === 3 ? concurrent(d) : single(d, scene))));
  const results = await load();
  results[`scene-${scene}`] = { ...results[`scene-${scene}`], ...Object.fromEntries(DESIGNS.map((d, i) => [d, done[i]])) };
  await fs.writeFile(RESULT, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ scene, result: results[`scene-${scene}`] }, null, 2));
}
