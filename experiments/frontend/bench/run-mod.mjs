// 실행: node bench/run-mod.mjs --conditions A,B,C --reps 1 --concurrency 3
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gradeStage } from './grade-mod.mjs';
import { ROOT, claude, summarize } from './workdir-ds.mjs';
import { assertSubscription, enterStage, prepare } from './workdir-mod.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const conditions = opt('--conditions', 'A,B,C').split(',');
const reps = Number(opt('--reps', 1));
const concurrency = Number(opt('--concurrency', 3));
const STAGES = [1, 2, 3, 4, 5];

console.log(`구독: ${assertSubscription()}`);
const runDir = path.join(ROOT, 'runs', `mod-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`);
await fs.mkdir(runDir, { recursive: true });

function diffStat(before, after) {
  const r = spawnSync('diff', ['-ruN', before, after], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout;
  const lines = r.split('\n');
  return { files: lines.filter((l) => l.startsWith('diff ')).length, lines: lines.filter((l) => /^[+-]([^+-]|$)/.test(l)).length };
}

// 고치기 전에 무엇을 얼마나 읽었는지 센다
function exploration(out) {
  const events = out.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const uses = events.filter((e) => e.type === 'assistant').flatMap((e) => e.message?.content ?? []).filter((c) => c.type === 'tool_use');
  const first = uses.findIndex((u) => ['Write', 'Edit'].includes(u.name));
  const before = first < 0 ? uses : uses.slice(0, first);
  return {
    readsBeforeEdit: before.filter((u) => ['Read', 'Grep', 'Glob'].includes(u.name)).length,
    srcReadsTotal: uses.filter((u) => u.name === 'Read' && /\/src\//.test(u.input.file_path ?? '')).length,
    edits: uses.filter((u) => ['Write', 'Edit'].includes(u.name)).length,
  };
}

async function one(cond, rep, port) {
  const outDir = path.join(runDir, cond, `rep${rep}`);
  await fs.mkdir(outDir, { recursive: true });
  const work = await prepare(cond);
  const stages = [];
  for (const stage of STAGES) {
    await enterStage(work, stage);
    const stageDir = path.join(outDir, `stage${stage}`);
    await fs.mkdir(stageDir, { recursive: true });
    const before = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-mod-before-'));
    await fs.cp(path.join(work, 'src'), before, { recursive: true });
    // 결과 줄이 없거나 오류로 끝난 실행은 과제와 상관없는 중단이므로 한 번 다시 돌린다
    let r, sum, attempts = 0;
    do {
      attempts += 1;
      r = await claude(work);
      sum = summarize(r.out);
      await fs.writeFile(path.join(stageDir, `steps-try${attempts}.jsonl`), r.out);
      await fs.writeFile(path.join(stageDir, `stderr-try${attempts}.txt`), `code ${r.code} signal ${r.signal}\n${r.err}`);
    } while (attempts < 2 && !r.timedOut && sum.isError);
    const change = diffStat(before, path.join(work, 'src'));
    await fs.rm(before, { recursive: true, force: true });
    const g = await gradeStage(work, path.join(stageDir, 'grade'), stage, port);
    await fs.cp(path.join(work, 'src'), path.join(stageDir, 'src'), { recursive: true });
    stages.push({ ...g, ...sum, ...exploration(r.out), change, attempts, timedOut: r.timedOut });
    if (sum.isError) break;
  }
  await fs.rm(work, { recursive: true, force: true });

  const result = {
    condition: cond, rep, stages, valid: stages.length === STAGES.length && stages.every((s) => !s.isError),
    costUsd: stages.reduce((n, s) => n + (s.costUsd ?? 0), 0),
    durationMs: stages.reduce((n, s) => n + (s.durationMs ?? 0), 0),
  };
  await fs.writeFile(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  await fs.appendFile(path.join(runDir, 'results.jsonl'), JSON.stringify(result) + '\n');
  const parts = stages.map((s) => {
    const k = String(Math.min(s.stage, 4));
    return s.stage === 5 ? Object.values(s.byFile).map((x) => `${x.pass}/${x.total}`).join('+') : `${s.byFile[k]?.pass}/${s.byFile[k]?.total}`;
  }).join(' ');
  console.log(`${cond} rep${rep} ${result.valid ? '' : '무효 '}[${parts}] 변경 ${stages[3]?.change?.files}파일 ${stages[3]?.change?.lines}줄 · ${stages[4]?.change?.files}파일 ${stages[4]?.change?.lines}줄  $${result.costUsd.toFixed(2)}  ${Math.round(result.durationMs / 1000)}s  API위치 ${stages[2]?.scan?.apiSites}  문구파일 ${stages[2]?.scan?.messageFiles}  줄 ${stages[2]?.scan?.lines}`);
}

const jobs = [];
for (let r = 1; r <= reps; r++) for (const c of conditions) jobs.push([c, r]);
console.log(`${runDir}: ${jobs.length}회`);
let next = 0;
await Promise.all(Array.from({ length: concurrency }, async (_, w) => {
  while (next < jobs.length) { const [c, r] = jobs[next++]; await one(c, r, 4800 + w); }
}));
console.log('완료');
