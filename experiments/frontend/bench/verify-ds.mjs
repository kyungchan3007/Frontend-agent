// 채점 검증: 빈 시작 코드와 기준 구현을 단계별로 채점한다
// 실행: node bench/verify-ds.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { gradeStage } from './grade-ds.mjs';
import { ROOT, enterStage, prepare } from './workdir-ds.mjs';

const REF = path.join(ROOT, 'hidden/ds/reference');
const out = path.join(ROOT, 'runs', 'verify-ds');
const brief = (g) => ({ stage: g.stage, built: g.built, byFile: g.byFile, failed: g.failed, pixels: g.pixels, consistency: g.consistency?.differingProps, scan: g.scan, axe: g.axe });

const empty = await prepare('C');
await enterStage(empty, 1);
console.log('빈 시작 코드', JSON.stringify(brief(await gradeStage(empty, path.join(out, 'empty'), 3, 4890))));
await fs.rm(empty, { recursive: true, force: true });

const work = await prepare('D');
const put = (f) => fs.cp(path.join(REF, f), path.join(work, 'src', f));
for (const [stage, file] of [[1, 'SubjectSheet.jsx'], [2, 'SubjectManager.jsx'], [3, 'PlanSheet.jsx']]) {
  await enterStage(work, stage);
  await put(file);
  console.log('기준 구현', JSON.stringify(brief(await gradeStage(work, path.join(out, `stage${stage}`), stage, 4891))));
}

// 4단계 변경을 공통 컴포넌트 한 곳씩만 고쳐 적용한다
await enterStage(work, 4);
const edit = async (f, from, to) => {
  const p = path.join(work, 'src', f);
  const t = await fs.readFile(p, 'utf8');
  if (!t.includes(from)) throw new Error(`${f}에 ${from} 없음`);
  await fs.writeFile(p, t.replace(from, to));
};
await edit('tokens.css', '--color-brand-strong: #0c8262;', '--color-brand-strong: #0c8262;\n  --color-brand-dark: #067a57;');
await edit('ui/Button.jsx', "L: 'h-13 px-6", "L: 'h-12 px-6");
await edit('ui/Button.jsx', 'rounded-md font-bold', 'rounded-xl font-bold');
await edit('ui/Chip.jsx', 'bg-primary text-inverse', 'bg-brand-dark text-inverse');
console.log('기준 구현', JSON.stringify(brief(await gradeStage(work, path.join(out, 'stage4'), 4, 4891))));
await fs.rm(work, { recursive: true, force: true });
