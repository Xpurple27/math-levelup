import { spawnSync } from "node:child_process";
const result = spawnSync(
  "npm",
  ["exec", "--", "vitest", "run", "tests/unit/content-qa.test.ts"],
  { stdio: "inherit", env: { ...process.env, LEVELUP_QA_REPORT: "1" } },
);
process.exit(result.status ?? 1);
