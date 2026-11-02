// 실행: node bench/run.mjs --conditions A,B,C,D --reps 1 --concurrency 2
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONDITIONS, EFFORT, MODEL, PROMPT } from './conditions.mjs';
import { grade } from './grade.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT_MS = 20 * 60 * 1000;
const PARENT_SESSION_VARS = ['ANTHROPIC_BASE_URL', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT'];

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const conditions = opt('--conditions', 'A,B,C,D').split(',');
const reps = Number(opt('--reps', 3));
const concurrency = Number(opt('--concurrency', 2));

async function prepare(cond) {
  const c = CONDITIONS[cond];
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `fe-small-${cond}-`));
  const F = path.join(ROOT, 'fixtures/small');
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  for (const f of ['package.json', 'index.html', 'vite.config.js', 'src']) await copy(path.join(ROOT, 'starter', f), f);
  for (const f of ['TASK.md', 'sdd.md', 'entities.md']) await copy(path.join(ROOT, 'task/small', f), f);
  await copy(path.join(F, 'screens'), 'screens');
  await fs.symlink(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'));
  if (c.map) {
    await copy(path.join(F, 'panels'), 'panels');
    await copy(path.join(F, 'tokens.json'), 'tokens.json');
    await copy(path.join(ROOT, 'task/small/design-map.md'), 'design-map.md');
  }
  if (c.gate) {
    await fs.mkdir(path.join(dir, 'tools'));
    for (const f of ['check.mjs', 'mock.mjs', 'serve.mjs', 'stop-gate.mjs']) await copy(path.join(ROOT, 'starter/tools', f), `tools/${f}`);
    await copy(path.join(ROOT, 'starter/visible'), 'visible');
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.writeFile(path.join(dir, '.claude/settings.json'), JSON.stringify({
      hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node tools/stop-gate.mjs', timeout: 180 }] }] },
    }, null, 2));
  }
  if (c.shot) for (const f of ['shot.mjs', 'compare.mjs']) await copy(path.join(ROOT, 'starter/tools', f), `tools/${f}`);
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), c.claude);
  return dir;
}

function claude(cwd) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    for (const v of PARENT_SESSION_VARS) delete env[v];
    const child = spawn('claude', [
      '-p', PROMPT, '--model', MODEL, '--effort', EFFORT,
      '--output-format', 'stream-json', '--verbose', '--permission-mode', 'dontAsk',
      '--allowedTools', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash(node:*)', 'Bash(npx:*)', 'Bash(npm:*)', 'Bash(ls:*)',
      '--setting-sources', 'project', '--strict-mcp-config', '--no-session-persistence',
    ], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', () => {});
    const t = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    child.on('close', (_, signal) => { clearTimeout(t); resolve({ out, timedOut: signal === 'SIGKILL' }); });
  });
}

const runDir = path.join(ROOT, 'runs', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
await fs.mkdir(runDir, { recursive: true });

async function one(cond, rep, port) {
  const outDir = path.join(runDir, cond, `rep${rep}`);
  await fs.mkdir(outDir, { recursive: true });
  const work = await prepare(cond);
  const { out, timedOut } = await claude(work);
  await fs.writeFile(path.join(outDir, 'steps.jsonl'), out);
  const events = out.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const last = events.findLast((e) => e.type === 'result');
  const uses = events.filter((e) => e.type === 'assistant').flatMap((e) => e.message?.content ?? []).filter((c) => c.type === 'tool_use');
  const reads = uses.filter((u) => u.name === 'Read').map((u) => u.input.file_path ?? '');
  const g = await grade(work, path.join(outDir, 'grade'), port);
  await fs.cp(path.join(work, 'src'), path.join(outDir, 'src'), { recursive: true });
  await fs.rm(work, { recursive: true, force: true });
  const result = {
    condition: cond, rep, ...g,
    costUsd: last?.total_cost_usd ?? null, durationMs: last?.duration_ms ?? null, turns: last?.num_turns ?? null,
    panelReads: reads.filter((r) => r.includes('/panels/')).length, mapRead: reads.some((r) => r.endsWith('design-map.md')),
    gateRuns: uses.filter((u) => u.name === 'Bash' && String(u.input.command).includes('check.mjs')).length,
    shotRuns: uses.filter((u) => u.name === 'Bash' && String(u.input.command).includes('shot.mjs')).length,
    permissionDenials: last?.permission_denials?.length ?? null, timedOut, isError: last ? Boolean(last.is_error) : true,
  };
  await fs.writeFile(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  await fs.appendFile(path.join(runDir, 'results.jsonl'), JSON.stringify(result) + '\n');
  console.log(`${cond} rep${rep}  ${result.pass}/${result.total}  픽셀 ${result.pixelAvg}  $${result.costUsd?.toFixed(2)}  ${Math.round((result.durationMs ?? 0) / 1000)}s  패널 ${result.panelReads}  게이트 ${result.gateRuns}  실패: ${result.failed.join(', ')}`);
}

const jobs = [];
for (let r = 1; r <= reps; r++) for (const c of conditions) jobs.push([c, r]);
console.log(`${runDir}: ${jobs.length}회`);
let next = 0;
await Promise.all(Array.from({ length: concurrency }, async (_, w) => {
  while (next < jobs.length) { const [c, r] = jobs[next++]; await one(c, r, 4900 + w); }
}));
console.log('완료');
