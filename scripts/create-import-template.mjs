import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";
const headers = [
  "example",
  "code",
  "exam",
  "section",
  "domain",
  "topic",
  "subtopic",
  "difficulty",
  "instruction",
  "stimulus",
  "stem",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "answer",
  "understanding",
  "known",
  "asked",
  "concept",
  "first_step",
  "solution",
  "final_answer",
  "shortcut",
  "common_mistake",
  "option_analysis",
  "source_type",
  "source_title",
  "source_page",
];
const book = new ExcelJS.Workbook(),
  sheet = book.addWorksheet("Questions");
sheet.addRow(headers);
sheet.addRow(
  headers.map(
    (k) =>
      ({
        example: "TRUE",
        code: "EXAMPLE-DO-NOT-IMPORT",
        exam: "SNBT",
        section: "PM",
        domain: "ALG",
        topic: "LIN",
        subtopic: "EQ",
        difficulty: "BASIC",
        stem: "EXAMPLE ONLY: Solve $x+1=3$.",
        option_a: "1",
        option_b: "2",
        option_c: "3",
        option_d: "4",
        answer: "B",
        understanding: "Find $x$.",
        concept: "Equality",
        first_step: "Subtract 1 from both sides.",
        solution: "$x=3-1=2$.",
        final_answer: "$x=2$.",
        source_type: "ORIGINAL",
        source_title: "Template example, not production content",
      })[k] || "",
  ),
);
sheet.views = [{ state: "frozen", ySplit: 1 }];
sheet.getRow(1).font = { bold: true };
sheet.columns.forEach((c) => {
  c.width = 25;
});
const guide = book.addWorksheet("Instructions");
[
  "LevelUP Content V2 import — examples are skipped when example=TRUE.",
  "Create your own rows. Set example=FALSE. Do not upload formula cells.",
  "Use exact existing taxonomy codes; unknown taxonomy or mismatched hierarchy invalidates the row.",
  "Initial taxonomy: SNBT; sections PK/PM/PU; ARI/NUM/RATIO or ARI/NUM/PERCENT or ALG/LIN/EQ.",
  "Difficulty BASIC/MEDIUM/HARD. Four required options A–D; optional E. Answer one letter only.",
  "Required explanation: understanding, concept, first_step, solution, final_answer.",
  "Markdown: $inline math$ or $$display math$$. Unsafe HTML is not rendered.",
  "Source types ORIGINAL, PAST_EXAM, ADAPTED, PDF, EXCEL, AI_ASSISTED, OTHER.",
  "Upload never publishes. Preview and confirm create drafts only; human QA and a separate Publish follow.",
  "Any invalid row blocks the whole import. Fix the workbook and upload again.",
  "Max 200 rows / 2 MB compressed / bounded expanded ZIP. Code is optional; duplicates rejected.",
].forEach((x) => guide.addRow([x]));
guide.getColumn(1).width = 110;
mkdirSync("public/templates", { recursive: true });
await book.xlsx.writeFile("public/templates/levelup-question-import.xlsx");
