// 루프 판정 — quick | full
//   LOOP=quick|full 이 있으면 그대로, 아니면 작업 폴더에 prd.md · sdd.md 가 있으면 full, 없으면 quick
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, currentSpec } from "./lib.mjs";

export function loopMode({ env = process.env.LOOP, has = () => false } = {}) {
  if (env === "quick" || env === "full") return env;
  return has("prd.md") || has("sdd.md") ? "full" : "quick";
}

/** Quick 인데 변경이 이만큼 크면 Full 권장 경고 */
export const QUICK_MAX_FILES = 10;

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = currentSpec();
  console.log(loopMode({ has: (f) => Boolean(spec.dir) && existsSync(join(ROOT, spec.dir, f)) }));
}
