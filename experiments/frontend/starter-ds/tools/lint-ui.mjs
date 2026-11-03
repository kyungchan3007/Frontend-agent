// 린트: 토큰 밖 색과 공통 컴포넌트 밖의 button · input을 막는다
import fs from 'node:fs';

const files = fs.readdirSync('src', { recursive: true }).filter((f) => /\.(jsx?|css)$/.test(f));
const errors = [];
for (const f of files) {
  if (f.endsWith('tokens.css')) continue;
  const text = fs.readFileSync(`src/${f}`, 'utf8');
  for (const m of text.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []) errors.push(`${f}: 토큰 밖 색 ${m}. src/tokens.css에 토큰을 두고 쓰세요`);
  if (f.startsWith('ui/') || f.startsWith('ui\\')) continue;
  for (const m of text.match(/<(button|input)\b/g) ?? []) errors.push(`${f}: ${m} 직접 사용. src/ui의 컴포넌트를 쓰세요`);
}
if (errors.length) { console.log('UI 린트 실패:\n' + errors.join('\n')); process.exit(1); }
console.log('UI 린트 통과');
