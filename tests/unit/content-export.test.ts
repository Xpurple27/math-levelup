import { readFileSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Markdown } from "@/components/markdown";
import { auditContent } from "../../scripts/audit-content-export.mjs";

it("renders each exported editorial field through the real shared renderer", () => {
  const input = process.env.VECTRA_QA_EXPORT;
  const rows = input
    ? JSON.parse(readFileSync(input, "utf8"))
    : [
        {
          code: "TEST_ONLY",
          id: "TEST_ONLY",
          stem_md: "$f(1)+f(2)$",
          options: [{ text: "$x=2$" }],
          explanation: { solution_md: "$$x=2$$" },
        },
      ];
  const failures: { code: string; field: string }[] = [];
  let fields = 0,
    renderedMathFields = 0;
  for (const q of rows) {
    const values = {
      stem: q.stem_md,
      instruction: q.instruction_md,
      stimulus: q.stimulus_md,
      ...Object.fromEntries(
        (q.options || []).map((o: { text: string }, i: number) => [
          `option${i}`,
          o.text,
        ]),
      ),
      ...q.explanation,
    };
    for (const [name, value] of Object.entries(values)) {
      if (typeof value !== "string" || !value.trim()) continue;
      fields++;
      const html = renderToStaticMarkup(
        createElement(Markdown, { text: value }),
      );
      if (html.includes('class="katex"')) renderedMathFields++;
      if (html.includes("katex-error") || html.includes('href="javascript:'))
        failures.push({ code: q.code, field: name });
    }
  }
  const report = {
    checked: "2026-10-27",
    scope: input
      ? "MT-01/MT-02 current versions, all nonempty fields"
      : "TEST_ONLY renderer fixture",
    questions: rows.length,
    fields,
    renderedMathFields,
    failures,
  };
  if (process.env.VECTRA_QA_RENDER_REPORT)
    writeFileSync(
      process.env.VECTRA_QA_RENDER_REPORT,
      JSON.stringify(report, null, 2) + "\n",
    );
  expect(failures).toEqual([]);
  expect(renderedMathFields).toBeGreaterThan(0);
  if (input) expect(auditContent(rows).questions).toBe(rows.length);
});

it("flags equivalent numeric options and a final-answer letter mismatch", () => {
  const report = auditContent([
    {
      code: "TEST_ONLY",
      id: "TEST_ONLY",
      options: [
        { key: "A", text: "$\\frac{1}{2}$", correct: true },
        { key: "B", text: "0,5", correct: false },
        { key: "C", text: "2", correct: false },
        { key: "D", text: "3", correct: false },
      ],
      explanation: {
        understanding_md: "test",
        concept_md: "test",
        first_step_md: "test",
        solution_md: "test",
        final_answer_md: "B",
        option_analysis_md: "test",
      },
    },
  ]);
  expect(report.findings[0].issues).toEqual(
    expect.arrayContaining([
      "equivalent-numeric-options",
      "final-answer-letter-mismatch",
    ]),
  );
});
