// 하네스 스크립트 테스트 — node --test .agents/scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import { globToRegExp, isTestFile, matchesAny, planSection } from "./lib.mjs";
import { protectedHits } from "./protected-check.mjs";
import { outOfPlan, removedAssertions } from "./scope-check.mjs";
import { emptyTemplate } from "./spec-check.mjs";
import { decide, isOutside, writeTargets } from "./outside-guard.mjs";

test("glob: ** · * · 폴더", () => {
  assert.ok(globToRegExp("src/cart/**").test("src/cart/a/b.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("src/a.test.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("a.test.ts"));
  assert.ok(!globToRegExp("src/*.ts").test("src/a/b.ts"));
  assert.ok(globToRegExp("docs/").test("docs/x.md"));
  assert.ok(matchesAny("AGENTS.md", ["AGENTS.md"]));
});

test("보호 파일: 목록에 걸린 것만", () => {
  assert.deepEqual(protectedHits(["src/a.ts", ".agents/checks.sh", "pnpm-lock.yaml"], [".agents/checks.sh", "pnpm-lock.yaml"]), [".agents/checks.sh", "pnpm-lock.yaml"]);
});

test("plan.md 섹션: 주석 · 빈 불릿 · 체크박스 제외, 백틱 제거", () => {
  const plan = "## 파일 계획\n<!-- 설명 -->\n- `src/cart/**`\n- \n- [ ] 이건 아님\n## 계획 밖 변경 이유\n- src/ui/Button.tsx — 공용 버튼 색 버그\n";
  assert.deepEqual(planSection(plan, "파일 계획"), ["src/cart/**"]);
  assert.deepEqual(planSection(plan, "계획 밖 변경 이유"), ["src/ui/Button.tsx — 공용 버튼 색 버그"]);
});

test("범위: 계획 · specs · 이유 적힌 파일은 통과, 나머지는 경고", () => {
  const files = ["src/cart/qty.ts", "src/ui/Button.tsx", "src/ui/Card.tsx", ".agents/specs/0001-x/plan.md"];
  assert.deepEqual(outOfPlan(files, ["src/cart/**"], ["src/ui/Button.tsx — 이유"]), ["src/ui/Card.tsx"]);
});

test("테스트 약화: 지워진 단언 줄만 센다", () => {
  const diff = "--- a/x.test.ts\n+++ b/x.test.ts\n-  expect(a).toBe(1)\n+  expect(a).toBe(2)\n-  const y = 1\n";
  assert.equal(removedAssertions(diff), 1);
  assert.ok(isTestFile("src/a.test.ts") && isTestFile("tests/a.ts") && !isTestFile("src/a.ts"));
});

test("작업 기록: 템플릿 그대로면 빈 것", () => {
  assert.ok(emptyTemplate("# 요청 원문\n\n<!-- 붙여 넣기 -->\n"));
  assert.ok(emptyTemplate("# 계획\n## 무엇을\n-\n- [ ] \n"));
  assert.ok(!emptyTemplate("# 요청 원문\n장바구니 수량 버그 고쳐 줘\n"));
});

test("밖 쓰기: 쓰기 대상만 뽑는다", () => {
  assert.deepEqual(writeTargets("bash x.sh > $HOME/.out 2>&1"), ["$HOME/.out"]);
  assert.deepEqual(writeTargets("cmd | tee -a /tmp/log && rm -f /tmp/a"), ["/tmp/log", "/tmp/a"]);
  assert.deepEqual(writeTargets("cp src/a.ts /tmp/b.ts"), ["/tmp/b.ts"]);
  assert.deepEqual(writeTargets("cat /etc/hosts && echo hi 2>/dev/null"), []); // 2> 는 표준 에러 리다이렉션, /dev 는 어차피 허용
});

test("밖 쓰기: 프로젝트 안 · /dev 는 허용, 밖은 차단", () => {
  const root = "/work/app";
  assert.ok(!isOutside("src/a.ts", root));
  assert.ok(!isOutside(".tmp/log", root));
  assert.ok(!isOutside("/dev/null", root));
  assert.ok(isOutside("/tmp/log", root));
  assert.ok(isOutside("../other/x", root));
  assert.ok(isOutside("~/x", root));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "cd /work/app && bash g.sh > /tmp/g.log" } }, root));
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "cd /work/app && bash g.sh > .tmp/g.log 2>/dev/null" } }, root), null);
  assert.ok(decide({ tool_name: "Write", tool_input: { file_path: "/Users/me/notes.md" } }, root));
  assert.equal(decide({ tool_name: "Write", tool_input: { file_path: "/work/app/src/a.ts" } }, root), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/etc/hosts" } }, root), null);
});

// 오케스트레이션 뼈대 — 지침서마다 필수 칸이 있는지 (내용은 비어도 됨)
import { readFileSync as read, readdirSync as list } from "node:fs";
const ORCH = new URL("../orchestration/", import.meta.url);
const headings = (file) => read(new URL(file, ORCH), "utf8").split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
const ROLE_SECTIONS = ["목적", "먼저 읽을 것", "할 일", "하지 않을 것", "받는 것", "넘기는 것", "완료 기준"];
const PATTERN_SECTIONS = ["언제 쓰나", "참여 역할", "흐름", "단계", "전달물", "합류 · 판정", "충돌 방지", "주의"];

test("오케스트레이션: 역할 지침서 필수 칸", () => {
  for (const f of list(new URL("roles/", ORCH)).filter((f) => f.endsWith(".md"))) {
    const missing = ROLE_SECTIONS.filter((s) => !headings(`roles/${f}`).includes(s));
    assert.deepEqual(missing, [], `roles/${f} 에 빠진 칸`);
  }
});

test("오케스트레이션: 패턴 지침서 필수 칸", () => {
  for (const f of list(new URL("patterns/", ORCH)).filter((f) => f.endsWith(".md"))) {
    const missing = PATTERN_SECTIONS.filter((s) => !headings(`patterns/${f}`).includes(s));
    assert.deepEqual(missing, [], `patterns/${f} 에 빠진 칸`);
  }
});

test("오케스트레이션: 6요소 · 4패턴이 README에 연결됨", () => {
  const readme = read(new URL("README.md", ORCH), "utf8");
  for (const s of ["분해·배정", "흐름", "전달물", "상태 공유", "합류·판정", "충돌 방지", "역할 분리", "병렬 분산", "감독자-작업자", "토론"]) assert.ok(readme.includes(s), s);
});

import { requiredDocs } from "./spec-check.mjs";
test("작업 기록: 작은 작업은 plan, 큰 작업은 prd + sdd", () => {
  assert.deepEqual(requiredDocs((f) => f === "plan.md"), ["plan.md"]);
  assert.deepEqual(requiredDocs((f) => f === "prd.md"), ["prd.md", "sdd.md", "trace.md"]);
  assert.deepEqual(requiredDocs(() => false, "full"), ["prd.md", "sdd.md", "trace.md"]);
  for (const f of ["request.md", "prd.md", "sdd.md", "trace.md"]) assert.ok(emptyTemplate(read(new URL(`../specs/_template-full/${f}`, import.meta.url), "utf8")), `${f} 템플릿은 빈 것으로 판정`);
  const sdd = read(new URL("../specs/_template-full/sdd.md", import.meta.url), "utf8");
  for (const s of ["접근", "대안 · 트레이드오프", "파일 계획", "계획 밖 변경 이유", "위험", "검증 계획", "계획과 달라진 점"]) assert.ok(sdd.includes(`## ${s}`), s);
});

import { loopMode } from "./loop-mode.mjs";
test("루프: LOOP 우선, 없으면 prd·sdd 있으면 full", () => {
  assert.equal(loopMode({ env: "", has: () => false }), "quick");
  assert.equal(loopMode({ env: "", has: (f) => f === "sdd.md" }), "full");
  assert.equal(loopMode({ env: "full", has: () => false }), "full");
  assert.equal(loopMode({ env: "quick", has: (f) => f === "sdd.md" }), "quick");
});
