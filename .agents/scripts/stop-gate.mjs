// Stop 훅 — 바뀐 파일이 있으면 끝내기 전에 게이트를 돌리고, 실패면 끝내지 못하게 돌려보낸다 (exit 2)
import { spawnSync } from "node:child_process";
import { ROOT, changedFiles } from "./lib.mjs";

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let event = {};
  try { event = JSON.parse(raw || "{}"); } catch {}
  if (event.stop_hook_active) process.exit(0); // 이미 한 번 돌려보낸 뒤면 무한 반복 방지
  if (changedFiles().length === 0) process.exit(0); // 질문·답만 한 대화는 검사하지 않음
  const r = spawnSync("bash", [".agents/checks.sh"], { cwd: ROOT, encoding: "utf8" });
  if (r.status === 0) process.exit(0);
  const tail = `${r.stdout}${r.stderr}`.trim().split("\n").slice(-25).join("\n");
  process.stderr.write(`[게이트 실패] 끝내기 전에 bash .agents/checks.sh 를 통과시키세요.\n${tail}\n`);
  process.exit(2);
});
