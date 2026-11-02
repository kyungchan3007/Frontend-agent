// 게이트: 빌드 · 토큰 검사 · 기본 동작 테스트
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const run = (cmd, args, env = {}) => spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } }).status === 0;
let ok = run('npx', ['vite', 'build', '--logLevel', 'error']);

const bad = fs.readdirSync('src', { recursive: true })
  .filter((f) => /\.(jsx?|css)$/.test(f) && !f.endsWith('tokens.css'))
  .flatMap((f) => (fs.readFileSync(`src/${f}`, 'utf8').match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).map((m) => `${f}: ${m}`));
if (bad.length) { console.log('토큰 밖 색상:\n' + bad.join('\n')); ok = false; }

if (ok) {
  const port = 5000 + Math.floor(Math.random() * 3000);
  const s = await serve('.', port);
  ok = run('npx', ['playwright', 'test', '--config', 'visible/playwright.config.mjs', '--reporter=line'], { BASE_URL: s.url });
  s.stop();
}
console.log(ok ? 'GATE PASS' : 'GATE FAIL');
process.exit(ok ? 0 : 1);
