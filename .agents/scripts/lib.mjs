// 하네스 공통 — git 변경 목록 · glob · 현재 작업(spec) 찾기
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function git(args, cwd = ROOT) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trimEnd(); // 앞 공백은 status 형식의 일부라 자르지 않음
  } catch {
    return "";
  }
}

/** 비교 기준: origin/main(또는 main)과의 갈림점. 기본 브랜치 위에서 작업 중이면 HEAD */
export function baseRef(cwd = ROOT) {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  for (const main of ["origin/main", "main", "origin/master", "master"]) {
    if (branch === main.replace("origin/", "")) return git(["rev-parse", "--verify", "-q", "HEAD"], cwd) || null;
    const mb = git(["merge-base", "HEAD", main], cwd);
    if (mb) return mb;
  }
  return git(["rev-parse", "--verify", "-q", "HEAD"], cwd) || null;
}

/** 이 작업에서 바뀐 파일 = 기준 이후 커밋 + 커밋 안 한 변경(새 파일 포함) */
export function changedFiles(cwd = ROOT) {
  const base = baseRef(cwd);
  const committed = base ? git(["diff", "--name-only", base, "HEAD"], cwd) : "";
  const working = git(["status", "--porcelain", "--untracked-files=all"], cwd)
    .split("\n").filter(Boolean).map((l) => l.slice(3).split(" -> ").pop().replace(/^"|"$/g, ""));
  return [...new Set([...committed.split("\n"), ...working].filter(Boolean))].sort();
}

/** glob → 정규식 (경로는 저장소 루트 기준, ** · * · ? 지원) */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") { re += "(?:.*/)?"; i += 2; } else { re += ".*"; i += 1; }
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  if (glob.endsWith("/")) re += ".*";
  return new RegExp(`^${re}$`);
}

export const matchesAny = (file, globs) => globs.some((g) => globToRegExp(g).test(file));

/** 줄 목록 파일(# 주석 · 빈 줄 무시) */
export function readList(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
}

/** 브랜치 이름의 4자리 번호 → .agents/specs/NNNN-이름 폴더 */
export function currentSpec(cwd = ROOT) {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  const id = /(?:^|[/-])(\d{4})(?:[/-]|$)/.exec(branch)?.[1];
  if (!id) return { branch, id: null, dir: null };
  const specs = join(cwd, ".agents/specs");
  const name = existsSync(specs) ? readdirSync(specs).find((d) => d.startsWith(`${id}-`)) : undefined;
  return { branch, id, dir: name ? join(".agents/specs", name) : null };
}

/** plan.md 의 "## 제목" 아래 불릿을 읽는다 (주석 · 빈 불릿 제외, 백틱 제거) */
export function planSection(text, title) {
  const lines = text.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const start = lines.findIndex((l) => l.trim().startsWith("## ") && l.includes(title));
  if (start < 0) return [];
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (l.startsWith("## ")) break;
    const m = /^\s*[-*]\s+(.+)$/.exec(l);
    if (m && m[1].trim() && !/^\[[ x]\]/.test(m[1].trim())) out.push(m[1].trim().replace(/`/g, ""));
  }
  return out;
}

export const isTestFile = (f) => /(\.|_)(test|spec)\.[cm]?[jt]sx?$|(^|\/)(__tests__|tests?)\//.test(f);
