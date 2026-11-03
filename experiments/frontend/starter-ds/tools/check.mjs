// 게이트: 빌드 · (있으면) 린트 · 기본 동작 테스트
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const run = (cmd, args, env = {}) => spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } }).status === 0;
let ok = run('npx', ['vite', 'build', '--logLevel', 'error']);
if (fs.existsSync('tools/lint-ui.mjs')) ok = run('node', ['tools/lint-ui.mjs']) && ok;

if (ok) {
  const port = 5000 + Math.floor(Math.random() * 3000);
  const s = await serve('.', port);
  ok = run('npx', ['playwright', 'test', '--config', 'visible/playwright.config.mjs', '--reporter=line'], { BASE_URL: s.url });
  s.stop();
}
console.log(ok ? 'GATE PASS' : 'GATE FAIL');
process.exit(ok ? 0 : 1);
