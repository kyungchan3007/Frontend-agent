// 단계별 채점: 숨은 테스트 · 중복 · 코드 양
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../starter/tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HIDDEN = path.join(ROOT, 'hidden/module');
const FILES = { 1: '1-sheet', 2: '2-manage', 3: '3-plan', 4: '4-rule' };
const RUN = { 1: ['1'], 2: ['1', '2'], 3: ['1', '2', '3'], 4: ['1', '2', '3', '4'], 5: ['1', '2', '3', '4'] };

const collect = (suite, file) => {
  const f = suite.file ?? file;
  return [...(suite.specs ?? []).map((s) => ({ title: s.title, ok: s.ok, file: path.basename(s.file ?? f) })), ...(suite.suites ?? []).flatMap((x) => collect(x, f))];
};

export function scan(work) {
  const src = path.join(work, 'src');
  const files = fs.readdirSync(src, { recursive: true }).map(String).filter((f) => /\.(jsx?)$/.test(f) && !f.startsWith('ui/') && !['main.jsx', 'App.jsx'].includes(f));
  const texts = files.map((f) => [f, fs.readFileSync(path.join(src, f), 'utf8')]);
  const count = (re) => texts.reduce((n, [, t]) => n + (t.match(re) ?? []).length, 0);
  const inFiles = (re) => texts.filter(([, t]) => re.test(t)).length;
  return {
    files: files.length,
    lines: texts.reduce((n, [, t]) => n + t.split('\n').length, 0),
    apiSites: count(/['"`]\/api[/'"`$]/g),
    apiFiles: inFiles(/['"`]\/api[/'"`$]/),
    fetchSites: count(/\bfetch\(/g),
    ruleFiles: inFiles(/\b(?:1[25])\b|(?:1[25])자/),
    messageFiles: inFiles(/까지 쓸 수 있어요/),
    sharedFiles: files.filter((f) => f.startsWith('shared/')).length,
    sharedImports: texts.filter(([f, t]) => !f.startsWith('shared/') && /from\s+['"][^'"]*shared/.test(t)).length,
  };
}

export function gradeStage(work, outDir, stage, port) {
  return (async () => {
    fs.mkdirSync(outDir, { recursive: true });
    const built = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: work, encoding: 'utf8' });
    if (built.status !== 0) return { stage, built: false, byFile: {}, failed: [], scan: scan(work), buildError: built.stderr.slice(-500) };
    const s = await serve(work, port);
    const report = path.join(outDir, 'hidden.json');
    const env = {
      ...process.env, BASE_URL: s.url, REPORT_FILE: report,
      NAME_MAX: stage >= 4 ? '12' : '15',
      API_PREFIX: stage >= 5 ? '/api/v2' : '/api',
    };
    spawnSync('npx', ['playwright', 'test', '--config', path.join(HIDDEN, 'playwright.config.mjs'), ...RUN[stage].map((k) => FILES[k])], { cwd: ROOT, encoding: 'utf8', env });
    s.stop();
    const specs = JSON.parse(fs.readFileSync(report, 'utf8')).suites.flatMap((x) => collect(x));
    const byFile = {};
    for (const [k, name] of Object.entries(FILES)) {
      const own = specs.filter((x) => x.file.startsWith(name));
      if (own.length) byFile[k] = { pass: own.filter((x) => x.ok).length, total: own.length };
    }
    return { stage, built: true, byFile, failed: specs.filter((x) => !x.ok).map((x) => x.title), scan: scan(work) };
  })();
}
