import { describe, expect, it } from "vitest";
import { bank } from "../fixtures/questions";
import {
  resolveQuestionSet,
  selectionReadiness,
} from "@/lib/content-readiness";
import { readableLearning } from "@/features/learning/read";
import { selectFromBank } from "@/lib/content-selection";

describe("runnable learning paths", () => {
  it("requires every diagnostic quota rather than a positive total", () => {
    expect(selectionReadiness(bank).diagnosticReady).toBe(true);
    expect(
      selectionReadiness(bank.filter((q) => q.section !== "PU"))
        .diagnosticReady,
    ).toBe(false);
    expect(
      selectionReadiness(
        bank.filter((q) => q.section !== "PU" || q.difficulty !== "Hard"),
      ).diagnosticReady,
    ).toBe(false);
  });
  it("rejects missing, outdated, duplicate logical questions and wrong sections", () => {
    const current = bank
      .slice(0, 2)
      .map((q, i) => ({ ...q, versionId: `v${i}` }));
    expect(resolveQuestionSet(["v1", "v0"], current)?.map((q) => q.id)).toEqual(
      [current[1].id, current[0].id],
    );
    expect(resolveQuestionSet(["v0", "obsolete"], current)).toBeNull();
    expect(resolveQuestionSet(["v0", "v0"], current)).toBeNull();
    expect(resolveQuestionSet(["v0"], current, "UNKNOWN")).toBeNull();
    expect(resolveQuestionSet([], current)).toBeNull();
  });
  it("hides published modules with empty lessons or archived taxonomy", () => {
    const data = {
      modules: [
        { id: "m1" },
        { id: "m2" },
        { id: "m3", subtopics: { status: "ARCHIVED" } },
      ],
      lessons: [
        { id: "l1", module_id: "m1" },
        { id: "l2", module_id: "m2" },
        { id: "l3", module_id: "m3" },
      ],
      blocks: [
        {
          id: "b1",
          lesson_id: "l1",
          block_type: "TEXT",
          content_json: { text: "A readable lesson" },
        },
        {
          id: "b2",
          lesson_id: "l2",
          block_type: "TEXT",
          content_json: { text: "  " },
        },
        {
          id: "b3",
          lesson_id: "l3",
          block_type: "TEXT",
          content_json: { text: "Archived" },
        },
      ],
      assignments: [],
    };
    const visible = readableLearning(data);
    expect(visible.modules.map((m) => m.id)).toEqual(["m1"]);
    expect(visible.lessons.map((m) => m.id)).toEqual(["l1"]);
    expect(visible.blocks.map((m) => m.id)).toEqual(["b1"]);
  });
  it("prioritizes unseen reassessment items without dropping difficulty quotas", () => {
    const pool = bank.filter((q) => q.topic === "rasio");
    const first = selectFromBank(pool, "mini", "rasio", 5, { random: () => 0 });
    const second = selectFromBank(pool, "mini", "rasio", 5, {
      random: () => 0,
      excludedIds: first.map((q) => q.id),
    });
    expect(second.every((q) => !first.some((old) => old.id === q.id))).toBe(
      true,
    );
    expect(second.filter((q) => q.difficulty === "Medium")).toHaveLength(3);
    expect(second.filter((q) => q.difficulty === "Hard")).toHaveLength(2);
  });
});
