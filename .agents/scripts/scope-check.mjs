// 범위 검사 — plan.md 또는 sdd.md "파일 계획" 밖 변경과 기존 테스트 약화를 경고(차단 아님, SCOPE_STRICT=1 이면 실패)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QUICK_MAX_FILES, loopMode } from "./loop-mode.mjs";
import { ROOT, baseRef, changedFiles, currentSpec, git, isTestFile, matchesAny, planSection } from "./lib.mjs";

/** 파일 계획이 있는 문서: 큰 작업은 sdd.md, 작은 작업은 plan.md */
const planFile = (dir) => ["sdd.md", "plan.md"].map((f) => join(dir, f)).find((f) => existsSync(join(ROOT, f)));

const ALWAYS_OK = [".agents/specs/**"];

export function outOfPlan(files, planGlobs, explained) {
  return files.filter((f) => !matchesAny(f, [...planGlobs, ...ALWAYS_OK]) && !explained.some((e) => e.startsWith(f)));
}

/** 기존 테스트에서 지워진 단언 줄 수 (새 파일은 제외) */
export function removedAssertions(diffText) {
  return diffText.split("\n").filter((l) => /^-(?!--)/.test(l) && /\b(expect|assert|should)\b|toBe|toEqual|toMatch/.test(l)).length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = currentSpec();
  const files = changedFiles();
  const warns = [];
  if (!spec.id) {
    console.log(`브랜치 "${spec.branch}"에 작업 번호(NNNN)가 없어 범위 검사를 건너뜁니다`);
  } else if (!spec.dir || !planFile(spec.dir)) {
    warns.push(`작업 ${spec.id}의 파일 계획(plan.md 또는 sdd.md)이 없습니다`);
  } else {
    const planPath = planFile(spec.dir);
    const plan = readFileSync(join(ROOT, planPath), "utf8");
    const globs = planSection(plan, "파일 계획");
    const explained = planSection(plan, "계획 밖 변경 이유");
    if (globs.length === 0) warns.push(`${planPath} "파일 계획"이 비어 있습니다`);
    const out = outOfPlan(files, globs, explained);
    if (out.length) warns.push(`계획 밖 변경 ${out.length}개 — ${planPath} "계획 밖 변경 이유"에 적거나 되돌리세요:\n${out.map((f) => `    - ${f}`).join("\n")}`);
  }
  if (spec.dir && loopMode({ has: (f) => existsSync(join(ROOT, spec.dir, f)) }) === "quick" && files.length > QUICK_MAX_FILES)
    warns.push(`Quick Loop 인데 바뀐 파일이 ${files.length}개입니다 (기준 ${QUICK_MAX_FILES}) — Full Loop(prd · sdd · trace)로 올리는 걸 검토하세요`);
  const base = baseRef();
  for (const f of files.filter(isTestFile)) {
    if (!base || !git(["cat-file", "-e", `${base}:${f}`])) continue; // 새 테스트는 자유
    const n = removedAssertions(git(["diff", base, "--", f]));
    if (n) warns.push(`기존 테스트 단언 ${n}줄 삭제·변경: ${f} — 테스트를 맞추려고 고친 게 아닌지 확인하세요`);
  }
  if (warns.length === 0) { console.log("범위 문제 없음"); process.exit(0); }
  console.log(warns.map((w) => `⚠️  ${w}`).join("\n"));
  process.exit(process.env.SCOPE_STRICT === "1" ? 1 : 0);
}
