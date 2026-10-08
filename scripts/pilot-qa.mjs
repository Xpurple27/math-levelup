import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", "tests/unit/pilot.test.ts"],
  { stdio: "inherit", env: { ...process.env, LEVELUP_PILOT_REPORT: "1" } },
);
process.exitCode = result.status ?? 1;
