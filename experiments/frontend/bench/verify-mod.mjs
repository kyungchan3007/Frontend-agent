// 채점 검증: 빈 시작 코드와 기준 구현을 단계별로 채점한다
// 실행: node bench/verify-mod.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { gradeStage } from './grade-mod.mjs';
import { ROOT } from './workdir-ds.mjs';
import { enterStage, prepare } from './workdir-mod.mjs';

const REF = path.join(ROOT, 'hidden/module/reference');
const out = path.join(ROOT, 'runs', 'verify-mod');
const brief = (g) => ({ stage: g.stage, built: g.built, byFile: g.byFile, failed: g.failed, scan: g.scan, err: g.buildError });

const empty = await prepare('A');
await enterStage(empty, 1);
console.log('빈 시작 코드', JSON.stringify((await gradeStage(empty, path.join(out, 'empty'), 3, 4790)).byFile));
await fs.rm(empty, { recursive: true, force: true });

const work = await prepare('B');
for (const [stage, file] of [[1, 'SubjectSheet.jsx'], [2, 'SubjectManager.jsx'], [3, 'PlanSheet.jsx']]) {
  await enterStage(work, stage);
  await fs.cp(path.join(REF, file), path.join(work, 'src', file));
  console.log('기준 구현', JSON.stringify(brief(await gradeStage(work, path.join(out, `stage${stage}`), stage, 4791))));
}

const edit = async (from, to) => {
  const p = path.join(work, 'src/shared/index.js');
  const t = await fs.readFile(p, 'utf8');
  if (!t.includes(from)) throw new Error(`${from} 없음`);
  await fs.writeFile(p, t.replace(from, to));
};
await enterStage(work, 4);
await edit('NAME_MAX = 15', 'NAME_MAX = 12');
console.log('기준 구현', JSON.stringify(brief(await gradeStage(work, path.join(out, 'stage4'), 4, 4791))));
await enterStage(work, 5);
await edit("API_BASE = '/api'", "API_BASE = '/api/v2'");
console.log('기준 구현', JSON.stringify(brief(await gradeStage(work, path.join(out, 'stage5'), 5, 4791))));
await fs.rm(work, { recursive: true, force: true });
