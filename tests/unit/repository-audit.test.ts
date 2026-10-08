import { it, expect } from "vitest";
// Load the CLI's scanner without running its git subprocesses or printing fixtures.
import { detectPrivateMaterial } from "../../scripts/audit-repository.mjs";
it("identifies private tokens/JWTs and excludes fixture emails and public anon JWTs", () => {
  const token = "sb_" + "secret_" + "x".repeat(30);
  expect(detectPrivateMaterial(token)).toContain("private-token-or-key");
  const jwt = (role: string) =>
    Buffer.from('{"alg":"HS256"}').toString("base64url") +
    "." +
    Buffer.from(JSON.stringify({ role })).toString("base64url") +
    "." +
    "signature";
  expect(detectPrivateMaterial(jwt("service_role"))).toContain(
    "service-role-jwt",
  );
  expect(detectPrivateMaterial(jwt("anon"))).toEqual([]);
  expect(detectPrivateMaterial("fixture@example.com")).toEqual([]);
  expect(detectPrivateMaterial("", ".data/levelup.sqlite")).toContain(
    "runtime-student-data-file",
  );
});

it("reviews the exact public registry deprecation contact but still detects other lockfile emails", () => {
  const lock = {
    packages: {
      "node_modules/glob": {
        resolved: "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz",
        deprecated: "contact " + ["i", "izs.me"].join("@"),
      },
    },
  };
  expect(
    detectPrivateMaterial(JSON.stringify(lock), "package-lock.json"),
  ).toEqual([]);
  expect(
    detectPrivateMaterial(
      JSON.stringify({ ...lock, owner: ["private", "real.test"].join("@") }),
      "package-lock.json",
    ),
  ).toContain("personal-email-review-needed");
});
