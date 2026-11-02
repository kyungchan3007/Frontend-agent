// 보호 파일 검사 — .agents/protected.txt 에 걸린 변경이 있으면 실패(사람 승인: ALLOW_PROTECTED=1)
import { join } from "node:path";
import { ROOT, changedFiles, matchesAny, readList } from "./lib.mjs";

export function protectedHits(files, globs) {
  return files.filter((f) => matchesAny(f, globs));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hits = protectedHits(changedFiles(), readList(join(ROOT, ".agents/protected.txt")));
  if (hits.length === 0) { console.log("보호 파일 변경 없음"); process.exit(0); }
  console.log(`보호 파일 변경 ${hits.length}개:\n${hits.map((f) => `  - ${f}`).join("\n")}`);
  if (process.env.ALLOW_PROTECTED === "1") { console.log("ALLOW_PROTECTED=1 → 사람 승인으로 통과"); process.exit(0); }
  console.log("→ 사람 승인 없이 바꾸면 안 되는 파일입니다. 되돌리거나 사람에게 승인을 요청하세요.");
  process.exit(1);
}
