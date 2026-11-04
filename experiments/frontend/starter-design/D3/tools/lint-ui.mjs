// 공통으로 올리는 기준 중 코드로 볼 수 있는 것만 검사한다
import fs from 'node:fs';
import path from 'node:path';

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk('src').filter((f) => /\.(tsx|jsx)$/.test(f));
const isUi = (f) => f.startsWith(path.join('src', 'ui') + path.sep);
const screens = files.filter((f) => !isUi(f));
const ui = files.filter(isUi);
const names = ui.map((f) => path.basename(f).replace(/\.\w+$/, ''));
const errors = [];

for (const f of screens) {
  const t = fs.readFileSync(f, 'utf8');
  if (/<(button|input)\b/.test(t)) errors.push(`${f}: <button> · <input>를 직접 만들지 말고 src/ui 컴포넌트를 쓰세요`);
  for (const n of names) {
    if (new RegExp(`<${n}\\b[^>]*\\bclassName=`).test(t)) errors.push(`${f}: ${n}에 className을 넘기지 말고 옵션을 쓰세요`);
  }
}

// 내용은 children으로 넣는다
for (const f of ui) {
  const sig = fs.readFileSync(f, 'utf8').match(/export default function \w+\(\{([^}]*)\}/)?.[1] ?? '';
  const bad = sig.replace(/'aria-label':\s*\w+/, '').match(/\b\w*(Icon|Label|Caption|Badge)\b|\b(icon|label|caption|badge)\b/g);
  if (bad) errors.push(`${f}: ${bad.join(', ')} 옵션 대신 children으로 넣으세요`);
}

// 같은 내용을 두 화면에 복사하지 않는다
const seen = new Map();
for (const f of screens) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/<span\s+aria-hidden(?:="true")?\s+className="([^"]+)"/g)) {
    if (!seen.has(m[1])) seen.set(m[1], new Set());
    seen.get(m[1]).add(f);
  }
}
for (const [cls, where] of seen) {
  if (where.size >= 2) errors.push(`같은 표시가 ${[...where].join(', ')}에 복사됨 ("${cls}"). src/ui 컴포넌트로 올리세요`);
}

for (const e of errors) console.error(e);
process.exit(errors.length ? 1 : 0);
