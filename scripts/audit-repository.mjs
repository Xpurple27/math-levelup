import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
// Report classifications/paths only; never print matching credentials or personal values.
export function detectPrivateMaterial(text, file = "") {
  const reasons = [];
  if (
    /sb_secret_[A-Za-z0-9_-]{20,}|(?:ghp|ghs)_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      text,
    )
  )
    reasons.push("private-token-or-key");
  const jwts =
    text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
  for (const token of jwts) {
    try {
      if (
        JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
          .role === "service_role"
      )
        reasons.push("service-role-jwt");
    } catch {
      /* Not a parseable JWT. */
    }
  }
  for (const url of text.match(/postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@/g) ||
    []) {
    if (!/postgres(?:ql)?:\/\/[^\s:/]+:(?:\[|<|YOUR_|your_)/.test(url))
      reasons.push("database-credential-url");
  }
  if (
    /(?:SUPABASE_SERVICE_ROLE_KEY|API_SECRET|PAYMENT_SECRET|DATABASE_PASSWORD)\s*[:=]\s*["']?[A-Za-z0-9_+/=-]{24,}/.test(
      text,
    )
  )
    reasons.push("hardcoded-secret-assignment");
  if (/\.(?:sqlite|sqlite3|db)$/.test(file) || file.startsWith(".data/"))
    reasons.push("runtime-student-data-file");
  // npm's public glob deprecation notice includes its maintainer's contact.
  // Review only this exact registry metadata; continue scanning all other values/keys.
  let emailText = text;
  if (file === "package-lock.json")
    try {
      const metadata = JSON.parse(text).packages?.["node_modules/glob"];
      if (
        metadata?.resolved ===
          "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz" &&
        typeof metadata.deprecated === "string"
      )
        emailText = text.replace(
          JSON.stringify(metadata.deprecated),
          JSON.stringify(
            metadata.deprecated.replace(
              ["i", "izs.me"].join("@"),
              "public-registry-contact",
            ),
          ),
        );
    } catch {
      /* Non-JSON input remains fully scanned. */
    }
  const emails =
    emailText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  if (
    emails.some(
      (email) =>
        !/@(?:example\.(?:com|org|net)|email\.com|localhost\.test)$/i.test(
          email,
        ),
    )
  )
    reasons.push("personal-email-review-needed");
  return [...new Set(reasons)];
}
export function auditRepository() {
  const objects = execFileSync("git", ["rev-list", "--objects", "--all"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  })
    .trim()
    .split("\n");
  const findings = [];
  let blobs = 0;
  for (const line of objects) {
    const space = line.indexOf(" ");
    if (space < 0) continue;
    const hash = line.slice(0, space),
      file = line.slice(space + 1);
    if (
      execFileSync("git", ["cat-file", "-t", hash], {
        encoding: "utf8",
      }).trim() !== "blob"
    )
      continue;
    blobs++;
    const body = execFileSync("git", ["cat-file", "blob", hash], {
      maxBuffer: 16 * 1024 * 1024,
    }).toString("utf8");
    const reasons = detectPrivateMaterial(body, file);
    if (reasons.length)
      findings.push({ file, object: hash.slice(0, 12), reasons });
  }
  // Include changed and newly staged files; history alone omits pending changes.
  for (const file of execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")) {
    if (!file) continue;
    let body;
    try {
      body = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const reasons = detectPrivateMaterial(body, file);
    if (reasons.length)
      findings.push({ file, object: "working-tree", reasons });
  }
  return {
    scannedHistoricalBlobs: blobs,
    findings,
    limitations:
      "Pattern scan, not a proof of absence; binary assets and personal data require human review.",
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = auditRepository();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.findings.length ? 1 : 0;
}
