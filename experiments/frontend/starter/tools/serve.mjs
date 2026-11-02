// 빌드한 앱을 띄우고 주소를 돌려준다
import { spawn } from 'node:child_process';

export async function serve(cwd, port) {
  const child = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd, stdio: 'ignore', detached: true });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try { await fetch(url); return { url, stop: () => process.kill(-child.pid) }; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  process.kill(-child.pid);
  throw new Error('미리보기 서버가 뜨지 않음');
}
