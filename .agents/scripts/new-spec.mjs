// 새 작업 폴더 — node .agents/scripts/new-spec.mjs <이름> [--full]
//   기본: request.md · plan.md (작은 작업) / --full: request.md · prd.md · sdd.md · trace.md (큰 작업)
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const full = process.argv.includes("--full");
const name = (process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "").trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g, "-").replace(/^-|-$/g, "");
if (!name) { console.error("사용법: npm run spec:new -- <이름>   예) npm run spec:new -- cart-qty [--full]"); process.exit(2); }
const specs = join(ROOT, ".agents/specs");
const ids = readdirSync(specs).map((d) => /^(\d{4})-/.exec(d)?.[1]).filter(Boolean).map(Number);
const id = String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4, "0");
const dir = join(specs, `${id}-${name}`);
if (existsSync(dir)) { console.error(`이미 있음: ${dir}`); process.exit(1); }
cpSync(join(specs, full ? "_template-full" : "_template"), dir, { recursive: true });
console.log(`만듦: .agents/specs/${id}-${name}/ (${full ? "Full Loop: request · prd · sdd · trace" : "Quick Loop: request · plan"})\n브랜치: git switch -c task/${id}-${name}`);
