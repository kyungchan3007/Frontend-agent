// 같은 앱을 역할 분담 구조 3가지로 만든다
// 실행: node bench/make-role.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, claude, summarize } from './workdir-ds.mjs';
import { appDir, assertSubscription, install } from './workdir-pkg.mjs';

assertSubscription();
const REF = path.join(ROOT, 'hidden/module/reference');
const TSCONFIG = {
  compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx', strict: true, allowJs: true, checkJs: false, noEmit: true, skipLibCheck: true, types: ['vite/client'] },
  include: ['src'],
};

async function make(shape) {
  const dir = await appDir(`fe-role-${shape}-`);
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  for (const f of ['SubjectSheet.jsx', 'SubjectManager.jsx', 'PlanSheet.jsx']) await copy(path.join(REF, f), `src/${f}`);
  await copy(path.join(ROOT, 'task/role/TASK.md'), 'TASK.md');
  await copy(path.join(ROOT, `task/role/shape-${shape}.md`), 'SHAPE.md');
  await fs.mkdir(path.join(dir, 'tools'));
  await copy(path.join(ROOT, 'starter/tools/serve.mjs'), 'tools/serve.mjs');
  for (const f of ['check.mjs', 'stop-gate.mjs']) await copy(path.join(ROOT, 'starter-ds/tools', f), `tools/${f}`);
  await copy(path.join(ROOT, 'starter-mod/tools/mock.mjs'), 'tools/mock.mjs');
  await fs.mkdir(path.join(dir, 'visible'));
  await copy(path.join(ROOT, 'starter/visible/playwright.config.mjs'), 'visible/playwright.config.mjs');
  for (const n of [1, 2, 3]) await copy(path.join(ROOT, `starter-ds/visible/${n}.spec.mjs`), `visible/${n}.spec.mjs`);
  await fs.writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify(TSCONFIG, null, 2) + '\n');
  const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
  Object.assign(pkg.dependencies, { typescript: '5.9.3', '@types/react': '19.2.2', '@types/react-dom': '19.2.2' });
  await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  await fs.mkdir(path.join(dir, '.claude'));
  await fs.writeFile(path.join(dir, '.claude/settings.json'), JSON.stringify({
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node tools/stop-gate.mjs', timeout: 180 }] }] },
  }, null, 2));
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), '# 작업 안내\n\n- 작업: TASK.md, 구조: SHAPE.md\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx` · `npm`으로 바로 실행한다\n');
  install(dir);
  const r = await claude(dir, 'TASK.md의 작업을 하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.', ['Bash(mv:*)', 'Bash(mkdir:*)', 'Bash(cp:*)']);
  const s = summarize(r.out);
  const tsc = spawnSync('npx', ['tsc', '--noEmit'], { cwd: dir, encoding: 'utf8' });
  const out = path.join(ROOT, `starter-role/${shape}`);
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });
  await fs.cp(dir, out, { recursive: true, filter: (p) => !/node_modules|\/dist(\/|$)|package-lock\.json|CLAUDE\.md|TASK\.md|\/\.claude|\/\.gate-tries|\/visible|\/tools|tokens\.json|shared-contract\.md|shared\.md|\/ui\.md|test-results/.test(p.slice(dir.length)) });
  await fs.rm(dir, { recursive: true, force: true });
  return { shape, isError: s.isError, tscOk: tsc.status === 0, tscErr: tsc.stdout.slice(-600), gateRuns: s.gateRuns };
}

console.log(JSON.stringify(await Promise.all(['A', 'B', 'C'].map(make)), null, 2));
