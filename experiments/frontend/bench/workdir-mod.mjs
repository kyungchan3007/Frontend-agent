// 공통 모듈 실험의 작업 폴더와 단계 자료
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CONDITIONS as DS } from './conditions-ds.mjs';
import { ROOT, baseDir } from './workdir-ds.mjs';

const P = (...a) => path.join(ROOT, ...a);
const SHARED = `- 공통 모듈: \`src/shared/\`, 설명은 shared.md. API 호출 · 과목 규칙 · 문구 · 오프라인은 여기 있는 것을 쓰고, 고칠 때도 여기서 고친다\n`;
const EXTRACT = `- 두 화면 이상에 쓰는 API 호출 · 규칙 · 문구 · 훅은 \`src/shared/\`로 옮겨 함께 쓴다\n`;

export const CONDITIONS = {
  A: { shared: false, claude: DS.C.claude },
  B: { shared: true, claude: DS.C.claude + SHARED },
  C: { shared: false, claude: DS.C.claude + EXTRACT },
};

// 구독이 아니면 실행하지 않는다
export function assertSubscription() {
  const env = { ...process.env };
  for (const v of ['ANTHROPIC_BASE_URL', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT']) delete env[v];
  const s = JSON.parse(spawnSync('claude', ['auth', 'status'], { env, encoding: 'utf8' }).stdout);
  if (s.authMethod !== 'claude.ai' || !s.subscriptionType) throw new Error(`구독 로그인이 아님: ${s.authMethod}`);
  return s.subscriptionType;
}

export async function moduleBase(prefix) {
  const dir = await baseDir(prefix, true);
  await fs.cp(P('fixtures/small/tokens.json'), path.join(dir, 'tokens.json'));
  await fs.cp(P('starter-ds/ui/src'), path.join(dir, 'src/ui'), { recursive: true });
  await fs.cp(P('starter-ds/ui/ui.md'), path.join(dir, 'ui.md'));
  return dir;
}

export async function prepare(cond) {
  const c = CONDITIONS[cond];
  const dir = await moduleBase(`fe-mod-${cond}-`);
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  if (c.shared) {
    await copy(P('starter-mod/shared/src'), 'src/shared');
    await copy(P('starter-mod/shared/shared.md'), 'shared.md');
    await copy(P('task/module/shared-contract.md'), 'shared-contract.md');
  }
  await fs.mkdir(path.join(dir, 'tools'));
  await copy(P('starter/tools/serve.mjs'), 'tools/serve.mjs');
  for (const f of ['check.mjs', 'stop-gate.mjs']) await copy(P('starter-ds/tools', f), `tools/${f}`);
  await copy(P('starter-mod/tools/mock.mjs'), 'tools/mock.mjs');
  await fs.mkdir(path.join(dir, 'visible'));
  await copy(P('starter/visible/playwright.config.mjs'), 'visible/playwright.config.mjs');
  await fs.mkdir(path.join(dir, '.claude'));
  await fs.writeFile(path.join(dir, '.claude/settings.json'), JSON.stringify({
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node tools/stop-gate.mjs', timeout: 180 }] }] },
  }, null, 2));
  await fs.writeFile(path.join(dir, 'CLAUDE.md'), c.claude);
  return dir;
}

export async function enterStage(dir, stage) {
  const copy = (from, to) => fs.cp(from, path.join(dir, to), { recursive: true });
  const docs = stage <= 3 ? P(`task/ds/${stage}`) : P(`task/module/${stage}`);
  for (const f of ['TASK.md', 'sdd.md', 'entities.md', 'design-map.md']) await copy(path.join(docs, f), f);
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
  // 바뀐 규칙과 경로에 맞춰 게이트의 테스트와 가짜 서버도 바꾼다
  if (stage === 4) await copy(P('starter-mod/visible/1.spec.mjs'), 'visible/1.spec.mjs');
  if (stage === 5) {
    const p = path.join(dir, 'tools/mock.mjs');
    const t = await fs.readFile(p, 'utf8');
    await fs.writeFile(p, t.replace("process.env.API_PREFIX ?? '/api'", "'/api/v2'"));
  }
  await fs.rm(path.join(dir, '.gate-tries'), { force: true });
}
