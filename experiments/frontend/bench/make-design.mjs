// 같은 앱을 설계 3가지로 만든다
// 실행: node bench/make-design.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT, claude, summarize } from './workdir-ds.mjs';
import { assertSubscription, install } from './workdir-pkg.mjs';

assertSubscription();
export const TOOLS = ['Bash(mv:*)', 'Bash(mkdir:*)', 'Bash(cp:*)', 'Bash(rm:*)', 'Bash(git rm:*)', 'Bash(git mv:*)'];

// 게이트와 보이는 테스트를 넣는다
export async function addTools(dir, specs = [1, 2, 3]) {
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  await fs.mkdir(path.join(dir, 'tools'), { recursive: true });
  await copy(path.join(ROOT, 'starter/tools/serve.mjs'), 'tools/serve.mjs');
  for (const f of ['check.mjs', 'stop-gate.mjs']) await copy(path.join(ROOT, 'starter-ds/tools', f), `tools/${f}`);
  await copy(path.join(ROOT, 'starter-mod/tools/mock.mjs'), 'tools/mock.mjs');
  await fs.mkdir(path.join(dir, 'visible'));
  await copy(path.join(ROOT, 'starter/visible/playwright.config.mjs'), 'visible/playwright.config.mjs');
  for (const n of specs) await copy(path.join(ROOT, `starter-ds/visible/${n}.spec.mjs`), `visible/${n}.spec.mjs`);
  await fs.mkdir(path.join(dir, '.claude'));
  await fs.writeFile(path.join(dir, '.claude/settings.json'), JSON.stringify({
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node tools/stop-gate.mjs', timeout: 180 }] }] },
  }, null, 2));
}

async function make(shape) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `fe-design-${shape}-`));
  await fs.cp(path.join(ROOT, 'starter-role/B'), dir, { recursive: true });
  await fs.cp(path.join(ROOT, 'task/design/TASK.md'), path.join(dir, 'TASK.md'));
  await fs.cp(path.join(ROOT, `task/design/shape-${shape}.md`), path.join(dir, 'SHAPE.md'));
  await addTools(dir);
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), '# 작업 안내\n\n- 작업: TASK.md, 설계: SHAPE.md\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx` · `npm`으로 바로 실행한다\n');
  install(dir);
  const r = await claude(dir, 'TASK.md의 작업을 하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.', TOOLS);
  const s = summarize(r.out);
  const tsc = spawnSync('npx', ['tsc', '--noEmit'], { cwd: dir, encoding: 'utf8' });
  const out = path.join(ROOT, `starter-design/${shape}`);
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });
  await fs.cp(dir, out, { recursive: true, filter: (p) => !/node_modules|\/dist(\/|$)|package-lock\.json|CLAUDE\.md|TASK\.md|\/\.claude|\/\.gate-tries|\/visible|\/tools|test-results/.test(p.slice(dir.length)) });
  await fs.rm(dir, { recursive: true, force: true });
  return { shape, isError: s.isError, tscOk: tsc.status === 0, tscErr: tsc.stdout.slice(-600), gateRuns: s.gateRuns };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await Promise.all((process.env.ONLY ?? 'A,B,C').split(',').map(make)), null, 2));
}
