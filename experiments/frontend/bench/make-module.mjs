// 공통 모듈을 에이전트로 한 번 만들고 환경 비용을 기록한다
// 실행: node bench/make-module.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { assertSubscription, moduleBase } from './workdir-mod.mjs';
import { ROOT, claude, summarize } from './workdir-ds.mjs';

assertSubscription();
const dir = await moduleBase('fe-mod-shared-');
await fs.cp(path.join(ROOT, 'task/ds/3/entities.md'), path.join(dir, 'entities.md'));
await fs.cp(path.join(ROOT, 'task/module/shared-contract.md'), path.join(dir, 'shared-contract.md'));
await fs.writeFile(path.join(dir, 'CLAUDE.md'), '# 작업 안내\n\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx`로 바로 실행한다\n');

const prompt = 'shared-contract.md의 공통 모듈을 src/shared/에 만드세요. API는 entities.md를 따르세요. 다른 파일은 바꾸지 마세요. 다 만들면 npx vite build로 확인하고, 쓰는 법을 shared.md에 짧게 적으세요. 끝나면 한 줄로 말하세요.';
const r = await claude(dir, prompt);
const s = summarize(r.out);
if (s.isError) throw new Error(`제작 실패: ${r.out.slice(-300)}`);
const built = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: dir, encoding: 'utf8' });
const out = path.join(ROOT, 'starter-mod/shared');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(path.join(dir, 'src/shared'), path.join(out, 'src'), { recursive: true });
await fs.cp(path.join(dir, 'shared.md'), path.join(out, 'shared.md'));
await fs.writeFile(path.join(out, 'cost.json'), JSON.stringify({ ...s, model: 'claude-sonnet-5-5', effort: 'low', buildOk: built.status === 0 }, null, 2) + '\n');
await fs.rm(dir, { recursive: true, force: true });
console.log(JSON.stringify({ ...s, buildOk: built.status === 0, buildErr: built.stderr.slice(-300) }));
