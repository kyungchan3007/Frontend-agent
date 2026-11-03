// 설계마다 변경을 이어서 쌓고, 마지막에 앱 전체를 바꾼다
// 실행: node bench/run-stack.mjs
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
const RESULT = path.join(ROOT, 'results/2026-11-03-stack.json');
const CODE = path.join(ROOT, 'results/design-stack');
const CLAUDE_MD = '# 작업 안내\n\n- 작업: TASK.md, 설계: SHAPE.md\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx` · `npm`으로 바로 실행한다\n- 파일을 지울 때는 `rm`을 쓴다\n';
const PROMPT = 'TASK.md의 작업을 하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.';
const RULES = '\n\n## 지킬 것\n- 스피너, 아이콘, 점, 작은 글자는 `aria-hidden`으로 둔다. 버튼을 읽는 이름은 바뀌지 않는다\n- 다른 동작과 문구는 바꾸지 않는다\n- 외부 패키지를 새로 더하지 않는다\n- `SHAPE.md`의 설계를 따른다\n\n## 확인\n- `node tools/check.mjs`가 GATE PASS다\n';
const git = (cwd, ...args) => spawnSync('git', ['-c', 'user.name=bench', '-c', 'user.email=bench@example.invalid', ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
let port = 4600;

const collect = (suite, file) => {
  const f = suite.file ?? file;
  return [...(suite.specs ?? []).map((s) => ({ title: s.title, ok: s.ok, file: f })), ...(suite.suites ?? []).flatMap((x) => collect(x, f))];
};

async function behavior(dir) {
  const build = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: dir, encoding: 'utf8' });
  if (build.status !== 0) return { built: false, error: build.stderr.slice(-500) };
  const s = await serve(dir, port++);
  const report = path.join(os.tmpdir(), `stack-${s.url.split(':').pop()}-${Date.now()}.json`);
  spawnSync('npx', ['playwright', 'test', '--config', path.join(ROOT, 'hidden/module/playwright.config.mjs'), '1-sheet', '2-manage', '3-plan'], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, BASE_URL: s.url, REPORT_FILE: report },
  });
  s.stop();
  const specs = JSON.parse(await fs.readFile(report, 'utf8')).suites.flatMap((x) => collect(x));
  return { built: true, pass: specs.filter((x) => x.ok).length, total: specs.length, failed: specs.filter((x) => !x.ok).map((x) => x.title) };
}

// 코드에 무엇이 남았는지 센다
async function inspect(dir) {
  const src = path.join(dir, 'src');
  const files = (await fs.readdir(src, { recursive: true })).map(String).filter((f) => /\.(tsx?|jsx?)$/.test(f));
  const texts = await Promise.all(files.map(async (f) => [f, await fs.readFile(path.join(src, f), 'utf8')]));
  const where = (re) => texts.filter(([, t]) => re.test(t)).map(([f]) => f);
  const uses = (name, self) => texts.filter(([f, t]) => f !== self && new RegExp(`\\b${name}\\b`).test(t)).length;
  const local = files.filter((f) => f.startsWith('screens/') && /\/[A-Z]\w+\.(jsx|tsx)$/.test(f));
  return {
    files: files.length,
    uiFiles: files.filter((f) => f.startsWith('ui/')).length,
    spinnerFiles: where(/animate-spin/),
    dotFiles: where(/rounded-full bg-current/),
    roundedLgFiles: where(/\brounded-lg\b/),
    screenLocalComponents: local,
    usedOnce: local.filter((f) => uses(path.basename(f).replace(/\.\w+$/, ''), f) <= 1),
  };
}

async function stack(design, steps) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `fe-stack-${design}-`));
  await fs.cp(path.join(ROOT, `starter-design/${design}`), dir, { recursive: true });
  await addTools(dir);
  await fs.writeFile(path.join(dir, '.gitignore'), 'node_modules\ndist\n.gate-tries\ntest-results\npackage-lock.json\nCLAUDE.md\nTASK.md\n');
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), CLAUDE_MD);
  git(dir, 'init', '-q');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');
  install(dir);
  const out = path.join(CODE, design);
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });
  const log = [];
  for (const [n, text] of steps) {
    await fs.writeFile(path.join(dir, 'TASK.md'), `# 작업\n\n${text}${RULES}`);
    await fs.rm(path.join(dir, '.gate-tries'), { force: true });
    const r = await claude(dir, PROMPT, TOOLS);
    const s = summarize(r.out);
    await fs.mkdir(path.join(ROOT, 'runs'), { recursive: true });
    await fs.writeFile(path.join(ROOT, `runs/stack-${design}-${n}.jsonl`), r.out);
    git(dir, 'add', '-A');
    git(dir, 'commit', '-qm', `step ${n}`);
    await fs.writeFile(path.join(out, `step-${n}.diff`), git(dir, 'diff', 'HEAD~1', 'HEAD').stdout);
    const files = git(dir, 'diff', '--name-status', 'HEAD~1', 'HEAD').stdout.trim().split('\n').filter(Boolean);
    log.push({ step: n, isError: s.isError, turns: s.turns, gateRuns: s.gateRuns, denials: s.permissionDenials, files, touchedCommon: files.some((f) => /\tsrc\/(ui\/|tokens\.css)/.test(f)) });
    console.log(design, n, s.isError ? 'ERROR' : 'ok', files.length);
  }
  const tsc = spawnSync('npx', ['tsc', '--noEmit'], { cwd: dir, encoding: 'utf8' });
  const result = { steps: log, tscOk: tsc.status === 0, tscErr: tsc.stdout.slice(-600), end: await inspect(dir), behavior: await behavior(dir) };
  await fs.cp(path.join(dir, 'src'), path.join(out, 'src'), { recursive: true });
  await fs.rm(dir, { recursive: true, force: true });
  return result;
}

const raw = await fs.readFile(path.join(ROOT, 'task/design/stack.md'), 'utf8');
const steps = raw.split(/^## /m).filter((x) => x.trim()).map((x) => {
  const [n, ...rest] = x.split('\n');
  return [Number(n), rest.join('\n').trim()];
});
const done = await Promise.all(DESIGNS.map((d) => stack(d, steps)));
const results = JSON.parse(await fs.readFile(RESULT, 'utf8').catch(() => '{}'));
DESIGNS.forEach((d, i) => { results[d] = done[i]; });
await fs.writeFile(RESULT, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
