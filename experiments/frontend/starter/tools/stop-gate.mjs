// 끝내기 전에 게이트를 돌린다. 실패하면 세 번까지 되돌려 보낸다
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const F = '.gate-tries';
const tries = fs.existsSync(F) ? Number(fs.readFileSync(F, 'utf8')) : 0;
if (tries >= 3) process.exit(0);
const r = spawnSync('node', ['tools/check.mjs'], { encoding: 'utf8' });
const shotsDone = () => {
  if (!fs.existsSync('tools/shot.mjs')) return true;
  if (!fs.existsSync('.shots/15.png')) return false;
  return fs.statSync('.shots/15.png').mtimeMs >= fs.statSync('src/SubjectSheet.jsx').mtimeMs;
};
if (r.status === 0 && shotsDone()) process.exit(0);
fs.writeFileSync(F, String(tries + 1));
if (r.status === 0) process.stderr.write('마지막 수정 뒤 node tools/shot.mjs를 돌려 화면을 확인하지 않았습니다.');
else process.stderr.write(`게이트 실패. 고친 뒤 끝내세요.\n${(r.stdout + r.stderr).slice(-3000)}`);
process.exit(2);
