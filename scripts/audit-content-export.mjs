// Read-only audit of an explicitly supplied editorial export, never a publisher.
// The report contains identifiers and issue labels, never answer bodies or user data.
import { readFileSync, writeFileSync } from "node:fs";
import katex from "katex";

export function numericOption(text) {
  const value = text
    .trim()
    .replace(/^\$|\$$/g, "")
    .replace(/\s+/g, "");
  const fraction =
    value.match(/^\\frac\{(-?\d+)\}\{(-?\d+)\}$/) ||
    value.match(/^(-?\d+)\/(-?\d+)$/);
  if (fraction && Number(fraction[2]) !== 0)
    return Number(fraction[1]) / Number(fraction[2]);
  if (/^-?\d+(?:[.,]\d+)?%?$/.test(value))
    return (
      Number(value.replace("%", "").replace(",", ".")) /
      (value.endsWith("%") ? 100 : 1)
    );
  return null;
}

export function auditContent(rows) {
  const findings = [];
  let mathFragments = 0;
  for (const q of rows) {
    const issues = [];
    const options = q.options || [];
    const correct = options.filter((o) => o.correct);
    if (options.length < 4 || options.length > 5) issues.push("option-count");
    if (correct.length !== 1) issues.push("single-key");
    const normalized = options.map((o) => o.text.trim().toLowerCase());
    if (new Set(normalized).size !== options.length)
      issues.push("duplicate-option-text");
    const numeric = options
      .map((o) => numericOption(o.text))
      .filter((v) => v !== null);
    if (new Set(numeric).size !== numeric.length)
      issues.push("equivalent-numeric-options");
    const e = q.explanation || {};
    for (const field of [
      "understanding_md",
      "concept_md",
      "first_step_md",
      "solution_md",
      "final_answer_md",
      "option_analysis_md",
    ]) {
      if (typeof e[field] !== "string" || !e[field].trim())
        issues.push(`missing-${field}`);
    }
    const finalLetter = String(e.final_answer_md || "")
      .replace(/\*/g, "")
      .match(/^(?:Jawaban:\s*)?([A-E])(?:\s*[.:]|$)/i)?.[1]
      ?.toUpperCase();
    if (finalLetter && correct.length === 1 && finalLetter !== correct[0].key)
      issues.push("final-answer-letter-mismatch");
    // A correct option called a distractor is a review flag, not an automatic verdict.
    if (
      correct.length === 1 &&
      new RegExp(
        `(?:^|[.;]\\s*)${correct[0].key}(?:[/,][A-E])*\\s+(?:menukar|membalik|mengabaikan|menambah)`,
        "i",
      ).test(e.option_analysis_md || "")
    )
      issues.push("manual-option-letter-review");
    const fields = [
      q.instruction_md,
      q.stimulus_md,
      q.stem_md,
      ...options.map((o) => o.text),
      ...Object.values(e),
    ];
    for (const [index, field] of fields.entries()) {
      if (typeof field !== "string") continue;
      for (const m of field.matchAll(
        /\$\$([\s\S]*?)\$\$|(?<!\\)\$([^$\n]+)\$/g,
      )) {
        mathFragments++;
        try {
          katex.renderToString(m[1] ?? m[2], {
            throwOnError: true,
            trust: false,
          });
        } catch {
          issues.push(`katex-field-${index}`);
        }
      }
    }
    if (issues.length)
      findings.push({
        code: q.code,
        version_id: q.id,
        issues: [...new Set(issues)],
      });
  }
  return {
    scope:
      "structural checks; mathematical/editorial approval remains independent",
    checked: "2026-10-27",
    questions: rows.length,
    mathFragments,
    flaggedQuestions: findings.length,
    findings,
  };
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output)
    throw new Error(
      "Usage: node scripts/audit-content-export.mjs input.json report.json",
    );
  const report = auditContent(JSON.parse(readFileSync(input, "utf8")));
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({
      questions: report.questions,
      flaggedQuestions: report.flaggedQuestions,
      mathFragments: report.mathFragments,
    }),
  );
}
