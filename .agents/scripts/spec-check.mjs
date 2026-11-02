// 작업 기록 검사 — 작업 브랜치면 request.md(원문) + Quick: plan.md / Full: prd · sdd · trace 가 채워져 있어야 한다
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, currentSpec } from "./lib.mjs";
import { loopMode } from "./loop-mode.mjs";

/** Quick Loop 는 plan.md, Full Loop 는 prd · sdd · trace (trace 는 작업하며 채움) */
export function requiredDocs(has, mode = has("prd.md") || has("sdd.md") ? "full" : "quick") {
  return mode === "full" ? ["prd.md", "sdd.md", "trace.md"] : ["plan.md"];
}

/** 템플릿 그대로인가: 주석 · 제목 · 인용 안내 · 빈 불릿 · 표 머리줄(머리 + 구분선)을 빼고 남는 게 없으면 빈 것 */
export function emptyTemplate(text) {
  const lines = text.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const isSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
  return lines
    .filter((l, i) => !isSep(l) && !isSep(lines[i + 1] ?? ""))
    .filter((l) => !/^\s*(#|>)/.test(l) && !/^\s*[-*]\s*(\[[ x]\])?\s*$/.test(l))
    .filter((l) => !/checks\.sh PASS/.test(l)) // 템플릿에 기본으로 들어 있는 완료 기준 줄
    .join("").trim().length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = currentSpec();
  if (!spec.id) { console.log("작업 브랜치 아님 — 건너뜀"); process.exit(0); }
  const problems = [];
  if (!spec.dir) problems.push(`.agents/specs/${spec.id}-*/ 폴더가 없습니다 (npm run spec:new -- 이름)`);
  else {
    const has = (f) => existsSync(join(ROOT, spec.dir, f));
    const required = ["request.md", ...requiredDocs(has, loopMode({ has }))];
    for (const f of required) {
      if (!has(f)) problems.push(`${spec.dir}/${f} 없음`);
      else if (emptyTemplate(readFileSync(join(ROOT, spec.dir, f), "utf8"))) problems.push(`${spec.dir}/${f} 가 비어 있습니다`);
    }
  }
  if (problems.length === 0) { console.log(`작업 ${spec.id} 기록 있음`); process.exit(0); }
  console.log(problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
