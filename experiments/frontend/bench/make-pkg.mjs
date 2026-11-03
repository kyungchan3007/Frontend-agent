// 처음부터 패키지로 시작하는 세팅을 에이전트로 한 번 만들고 공수를 기록한다
// 실행: node bench/make-pkg.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, claude, summarize } from './workdir-ds.mjs';
import { TOOLS, appDir, assertSubscription, diffStat, install, snapshot } from './workdir-pkg.mjs';
import os from 'node:os';

assertSubscription();
const dir = await appDir('fe-pkg-make-');
install(dir);
await fs.cp(path.join(ROOT, 'task/pkg/split-task.md'), path.join(dir, 'TASK.md'));
await fs.writeFile(path.join(dir, 'CLAUDE.md'), '# 작업 안내\n\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx` · `npm`으로 바로 실행한다\n');
const before = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-pkg-before-'));
await snapshot(dir, before);
const r = await claude(dir, 'TASK.md의 작업을 하세요. 끝나면 무엇을 했는지 한 줄로 말하세요.', TOOLS);
const s = summarize(r.out);
if (s.isError) throw new Error(`세팅 실패: ${r.out.slice(-300)}`);
const built = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: dir, encoding: 'utf8' });
const after = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-pkg-after-'));
await snapshot(dir, after);
const changedFiles = diffStat(before, after);

const out = path.join(ROOT, 'starter-pkg');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(dir, path.join(out, 'template'), {
  recursive: true,
  filter: (p) => !/node_modules|\/dist(\/|$)|package-lock\.json|CLAUDE\.md|TASK\.md|\/\.claude/.test(p.slice(dir.length)),
});
await fs.writeFile(path.join(out, 'setup.json'), JSON.stringify({ ...s, costUsd: undefined, changedFiles, model: 'claude-sonnet-5-5', effort: 'low', buildOk: built.status === 0 }, null, 2) + '\n');
await fs.writeFile(path.join(out, 'steps.jsonl'), r.out);
await fs.rm(dir, { recursive: true, force: true });
console.log(JSON.stringify({ ...s, changedFiles, buildOk: built.status === 0, buildErr: built.stderr.slice(-300) }));
