// 실행: node bench/run-ds.mjs --conditions A,B,C,D --reps 3 --concurrency 2
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gradeStage } from './grade-ds.mjs';
import { ROOT, claude, enterStage, prepare, summarize } from './workdir-ds.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const conditions = opt('--conditions', 'A,B,C,D').split(',');
const reps = Number(opt('--reps', 3));
const concurrency = Number(opt('--concurrency', 2));
const STAGES = [1, 2, 3, 4];

const runDir = path.join(ROOT, 'runs', `ds-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`);
await fs.mkdir(runDir, { recursive: true });

function diffStat(before, after) {
  const r = spawnSync('diff', ['-ruN', before, after], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout;
  const lines = r.split('\n');
  return {
    files: lines.filter((l) => l.startsWith('diff ')).length,
    lines: lines.filter((l) => /^[+-][^+-]/.test(l) || l === '+' || l === '-').length,
  };
}

async function one(cond, rep, port) {
  const outDir = path.join(runDir, cond, `rep${rep}`);
  await fs.mkdir(outDir, { recursive: true });
  const work = await prepare(cond);
  const stages = [];
  let change = null;
  for (const stage of STAGES) {
    await enterStage(work, stage);
    const stageDir = path.join(outDir, `stage${stage}`);
    await fs.mkdir(stageDir, { recursive: true });
    const before = stage === 4 ? await fs.mkdtemp(path.join(os.tmpdir(), 'fe-ds-before-')) : null;
    if (before) await fs.cp(path.join(work, 'src'), before, { recursive: true });
    // 결과 줄 없이 끝난 실행은 과제와 상관없는 중단이므로 한 번 다시 돌린다
    let r, attempts = 0;
    do {
      attempts += 1;
      r = await claude(work);
      await fs.writeFile(path.join(stageDir, `steps-try${attempts}.jsonl`), r.out);
      await fs.writeFile(path.join(stageDir, `stderr-try${attempts}.txt`), `code ${r.code} signal ${r.signal}\n${r.err}`);
    } while (attempts < 2 && !r.timedOut && !r.out.includes('"type":"result"'));
    if (before) {
      change = diffStat(before, path.join(work, 'src'));
      await fs.rm(before, { recursive: true, force: true });
    }
    const g = await gradeStage(work, path.join(stageDir, 'grade'), stage, port);
    await fs.cp(path.join(work, 'src'), path.join(stageDir, 'src'), { recursive: true });
    stages.push({ ...g, ...summarize(r.out), attempts, timedOut: r.timedOut });
  }
  await fs.rm(work, { recursive: true, force: true });

  const newest = (s) => s.byFile?.[s.stage] ?? { pass: 0, total: 0 };
  const after3 = stages[2].byFile ?? {};
  const after4 = stages[3].byFile ?? {};
  const keep = (o) => ['1', '2', '3'].reduce((n, k) => n + (o[k]?.pass ?? 0), 0);
  const result = {
    condition: cond, rep, stages, change,
    pass: stages.reduce((n, s) => n + newest(s).pass, 0),
    total: 53,
    passAfter3: keep(after3), passAfter4: keep(after4),
    costUsd: stages.reduce((n, s) => n + (s.costUsd ?? 0), 0),
    durationMs: stages.reduce((n, s) => n + (s.durationMs ?? 0), 0),
  };
  await fs.writeFile(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  await fs.appendFile(path.join(runDir, 'results.jsonl'), JSON.stringify(result) + '\n');
  const parts = stages.map((s) => `${newest(s).pass}/${newest(s).total}`).join(' ');
  console.log(`${cond} rep${rep}  ${result.pass}/${result.total} [${parts}]  유지 ${result.passAfter3}→${result.passAfter4}  변경 ${change?.files}파일 ${change?.lines}줄  $${result.costUsd.toFixed(2)}  ${Math.round(result.durationMs / 1000)}s  일관성 ${stages[2].consistency?.differingProps?.join('·') || '-'}  버튼 ${stages[2].scan?.rawButtons}  색 ${stages[2].scan?.offTokenColors}`);
}

const jobs = [];
for (let r = 1; r <= reps; r++) for (const c of conditions) jobs.push([c, r]);
console.log(`${runDir}: ${jobs.length}회`);
let next = 0;
await Promise.all(Array.from({ length: concurrency }, async (_, w) => {
  while (next < jobs.length) { const [c, r] = jobs[next++]; await one(c, r, 4900 + w); }
}));
console.log('완료');
