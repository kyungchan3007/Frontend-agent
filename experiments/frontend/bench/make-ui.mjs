// 공통 컴포넌트를 에이전트로 한 번 만들고 비용을 기록한다
// 실행: node bench/make-ui.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, baseDir, claude, summarize } from './workdir-ds.mjs';

const dir = await baseDir('fe-ds-ui-', true);
await fs.cp(path.join(ROOT, 'fixtures/ds/components'), path.join(dir, 'components'), { recursive: true });
await fs.cp(path.join(ROOT, 'fixtures/small/tokens.json'), path.join(dir, 'tokens.json'));
await fs.cp(path.join(ROOT, 'task/ds/ui-contract.md'), path.join(dir, 'ui-contract.md'));
await fs.writeFile(path.join(dir, 'CLAUDE.md'), '# 작업 안내\n\n- 파일은 Write · Edit 도구로 쓴다. 명령은 작업 폴더에서 `node` · `npx`로 바로 실행한다\n');

const prompt = 'ui-contract.md의 공통 컴포넌트를 src/ui/에 React + Tailwind로 만드세요. 모양은 components/의 카드 이미지를 모두 읽고 따르고, 색 · 모서리는 src/tokens.css의 토큰을 쓰세요. 다른 파일은 바꾸지 마세요. 다 만들면 npx vite build로 확인하고, 각 컴포넌트의 쓰는 법을 ui.md에 짧게 적으세요. 끝나면 한 줄로 말하세요.';
const r = await claude(dir, prompt);
const s = summarize(r.out);
const built = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: dir, encoding: 'utf8' });
const out = path.join(ROOT, 'starter-ds/ui');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(path.join(dir, 'src/ui'), path.join(out, 'src'), { recursive: true });
await fs.cp(path.join(dir, 'ui.md'), path.join(out, 'ui.md'));
await fs.mkdir(path.join(ROOT, 'runs'), { recursive: true });
await fs.writeFile(path.join(ROOT, 'runs/ui-steps.jsonl'), r.out);
await fs.writeFile(path.join(out, 'cost.json'), JSON.stringify({ ...s, model: 'claude-sonnet-5-5', effort: 'low', buildOk: built.status === 0 }, null, 2) + '\n');
await fs.rm(dir, { recursive: true, force: true });
console.log(JSON.stringify({ ...s, buildOk: built.status === 0, buildErr: built.stderr.slice(-300) }));
