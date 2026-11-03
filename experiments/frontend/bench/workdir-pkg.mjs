// 패키지 비교에 쓰는 앱 폴더와 도구
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { indexCss, ROOT } from './workdir-ds.mjs';
export { assertSubscription } from './workdir-mod.mjs';

const P = (...a) => path.join(ROOT, ...a);
export const TOOLS = ['Bash(mv:*)', 'Bash(mkdir:*)', 'Bash(cp:*)'];

// 외부 패키지는 실험 폴더와 같은 버전으로 고정한다
function deps() {
  const names = Object.keys(JSON.parse(fs.readFileSync(P('package.json'), 'utf8')).dependencies);
  return Object.fromEntries(names.map((n) => [n, JSON.parse(fs.readFileSync(P('node_modules', n, 'package.json'), 'utf8')).version]));
}

export async function appDir(prefix) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  const copy = (from, to) => fsp.cp(from, path.join(dir, to), { recursive: true });
  await copy(P('starter/index.html'), 'index.html');
  await copy(P('starter/vite.config.js'), 'vite.config.js');
  await fsp.writeFile(path.join(dir, 'package.json'), JSON.stringify({
    name: 'study-app', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build' }, dependencies: deps(),
  }, null, 2) + '\n');
  await copy(P('starter-ds/src'), 'src');
  await fsp.writeFile(path.join(dir, 'src/index.css'), indexCss(true));
  await copy(P('starter-ds/tokens.css'), 'src/tokens.css');
  await copy(P('fixtures/small/tokens.json'), 'tokens.json');
  await copy(P('starter-ds/ui/src'), 'src/ui');
  await copy(P('starter-ds/ui/ui.md'), 'ui.md');
  await copy(P('starter-mod/shared/src'), 'src/shared');
  await copy(P('starter-mod/shared/shared.md'), 'shared.md');
  await copy(P('task/module/shared-contract.md'), 'shared-contract.md');
  return dir;
}

export function install(dir) {
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--prefer-offline'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`npm install 실패: ${r.stderr.slice(-500)}`);
}

const TREE = ['src', 'packages', 'package.json', 'vite.config.js', 'index.html'];
export async function snapshot(dir, to) {
  for (const f of TREE) {
    const from = path.join(dir, f);
    if (fs.existsSync(from)) await fsp.cp(from, path.join(to, f), { recursive: true, filter: (s) => !s.includes('node_modules') });
  }
}

export function diffStat(before, after) {
  const r = spawnSync('diff', ['-ruN', '-x', 'node_modules', '-x', 'dist', before, after], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout;
  return r.split('\n').filter((l) => l.startsWith('diff ')).length;
}
