// 작업 폴더를 만들고 단계 자료를 넣는다
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONDITIONS, EFFORT, MODEL, PROMPT } from './conditions-ds.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT_MS = 20 * 60 * 1000;
const PARENT_SESSION_VARS = ['ANTHROPIC_BASE_URL', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT'];
const P = (...a) => path.join(ROOT, ...a);

export function indexCss(tokens) {
  return `@import 'tailwindcss';\n${tokens ? "@import './tokens.css';\n" : ''}\nbody {\n  margin: 0;\n  font-family: 'Noto Sans KR', sans-serif;\n  letter-spacing: -0.01em;\n  line-height: 1.4;\n}\n`;
}

// 앱 뼈대. 게이트 없는 컴포넌트 제작에도 쓴다
export async function baseDir(prefix, tokens) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  for (const f of ['package.json', 'index.html', 'vite.config.js']) await copy(P('starter', f), f);
  await copy(P('starter-ds/src'), 'src');
  await fs.writeFile(path.join(dir, 'src/index.css'), indexCss(tokens));
  if (tokens) await copy(P('starter-ds/tokens.css'), 'src/tokens.css');
  await fs.symlink(P('node_modules'), path.join(dir, 'node_modules'));
  return dir;
}

export async function prepare(cond) {
  const c = CONDITIONS[cond];
  const dir = await baseDir(`fe-ds-${cond}-`, c.tokens);
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  if (c.tokens) await copy(P('fixtures/small/tokens.json'), 'tokens.json');
  if (c.ui) {
    await copy(P('starter-ds/ui/src'), 'src/ui');
    await copy(P('starter-ds/ui/ui.md'), 'ui.md');
  }
  await fs.mkdir(path.join(dir, 'tools'));
  await copy(P('starter/tools/serve.mjs'), 'tools/serve.mjs');
  for (const f of ['check.mjs', 'stop-gate.mjs', 'mock.mjs']) await copy(P('starter-ds/tools', f), `tools/${f}`);
  if (c.lint) await copy(P('starter-ds/tools/lint-ui.mjs'), 'tools/lint-ui.mjs');
  await fs.mkdir(path.join(dir, 'visible'));
  await copy(P('starter/visible/playwright.config.mjs'), 'visible/playwright.config.mjs');
  await fs.mkdir(path.join(dir, '.claude'));
  await fs.writeFile(path.join(dir, '.claude/settings.json'), JSON.stringify({
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node tools/stop-gate.mjs', timeout: 180 }] }] },
  }, null, 2));
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), c.claude);
  return dir;
}

// 단계가 시작될 때 그 단계 자료만 넣는다. 뒤 단계 화면은 미리 보여 주지 않는다
export async function enterStage(dir, stage) {
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  for (const f of ['TASK.md', 'sdd.md', 'entities.md', 'design-map.md']) await copy(P(`task/ds/${stage}`, f), f);
  if (stage === 1) {
    await copy(P('fixtures/small/screens'), 'screens');
    await copy(P('fixtures/small/panels'), 'panels');
  }
  if (stage === 2 || stage === 3) {
    const n = stage === 2 ? '16' : '32';
    await copy(P(`fixtures/ds/screens/${n}.png`), `screens/${n}.png`);
    await copy(P(`fixtures/ds/panels/${n}.png`), `panels/${n}.png`);
  }
  if (stage <= 3) await copy(P(`starter-ds/visible/${stage}.spec.mjs`), `visible/${stage}.spec.mjs`);
  await fs.rm(path.join(dir, '.gate-tries'), { force: true });
}

export function claude(cwd, prompt = PROMPT, extraTools = []) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    for (const v of PARENT_SESSION_VARS) delete env[v];
    const child = spawn('claude', [
      '-p', prompt, '--model', MODEL, '--effort', EFFORT,
      '--output-format', 'stream-json', '--verbose', '--permission-mode', 'dontAsk',
      '--allowedTools', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash(node:*)', 'Bash(npx:*)', 'Bash(npm:*)', 'Bash(ls:*)', ...extraTools,
      '--setting-sources', 'project', '--strict-mcp-config', '--no-session-persistence',
    ], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const t = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    child.on('close', (code, signal) => { clearTimeout(t); resolve({ out, err, code, signal, timedOut: signal === 'SIGKILL' }); });
  });
}

export function summarize(out) {
  const events = out.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const last = events.findLast((e) => e.type === 'result');
  const uses = events.filter((e) => e.type === 'assistant').flatMap((e) => e.message?.content ?? []).filter((c) => c.type === 'tool_use');
  const bash = uses.filter((u) => u.name === 'Bash').map((u) => String(u.input.command));
  const reads = uses.filter((u) => u.name === 'Read').map((u) => u.input.file_path ?? '');
  return {
    costUsd: last?.total_cost_usd ?? null, durationMs: last?.duration_ms ?? null, turns: last?.num_turns ?? null,
    uiDocRead: reads.some((r) => r.endsWith('ui.md')),
    gateRuns: bash.filter((c) => /node (\S*\/)?tools\/check\.mjs/.test(c)).length,
    permissionDenials: last?.permission_denials?.length ?? null,
    isError: last ? Boolean(last.is_error) : true,
  };
}
