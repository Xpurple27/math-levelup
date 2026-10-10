import { inflateRawSync } from "node:zlib";
import { blankDraft, explanationFields, type Catalog, type Draft } from "./model";
import type { ImportPreview, ImportRow } from "./excel";

type DocxDefaults = {
  section_id: string;
  subtopic_id: string;
  difficulty: string;
  source_title: string;
};

type ZipEntry = { name: string; method: number; compressed: number; size: number; local: number };

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function zipEntries(bytes: Uint8Array): { buffer: Buffer; entries: ZipEntry[]; directoryOffset: number } {
  if (bytes.length > 8 * 1024 * 1024) throw new Error("DOCX maksimal 8 MB.");
  const buffer = Buffer.from(bytes);
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("File DOCX/ZIP tidak valid.");
  const count = buffer.readUInt16LE(end + 10);
  const directoryOffset = buffer.readUInt32LE(end + 16);
  if (count > 4096 || directoryOffset === 0xffffffff) throw new Error("DOCX terlalu besar/ZIP64 tidak didukung.");
  let pos = directoryOffset;
  let expanded = 0;
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (pos + 46 > buffer.length || buffer.readUInt32LE(pos) !== 0x02014b50) throw new Error("Arsip DOCX rusak.");
    const method = buffer.readUInt16LE(pos + 10);
    const compressed = buffer.readUInt32LE(pos + 20);
    const size = buffer.readUInt32LE(pos + 24);
    const nameLength = buffer.readUInt16LE(pos + 28);
    const extraLength = buffer.readUInt16LE(pos + 30);
    const commentLength = buffer.readUInt16LE(pos + 32);
    const local = buffer.readUInt32LE(pos + 42);
    const name = buffer.subarray(pos + 46, pos + 46 + nameLength).toString("utf8");
    expanded += size;
    if (expanded > 64 * 1024 * 1024 || size > 16 * 1024 * 1024 || ![0, 8].includes(method)) throw new Error("DOCX expanded size/metode kompresi tidak didukung.");
    entries.push({ name, method, compressed, size, local });
    pos += 46 + nameLength + extraLength + commentLength;
  }
  return { buffer, entries, directoryOffset };
}

function readZipEntry(buffer: Buffer, entry: ZipEntry, directoryOffset: number) {
  const local = entry.local;
  if (local + 30 > buffer.length || buffer.readUInt32LE(local) !== 0x04034b50) throw new Error("Arsip DOCX rusak.");
  const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
  if (start + entry.compressed > directoryOffset) throw new Error("Arsip DOCX rusak.");
  const encoded = buffer.subarray(start, start + entry.compressed);
  const decoded = entry.method === 0 ? encoded : inflateRawSync(encoded, { maxOutputLength: 16 * 1024 * 1024 });
  if (decoded.length !== entry.size) throw new Error("Ukuran expanded DOCX tidak sesuai.");
  return decoded;
}

export function extractDocxText(bytes: Uint8Array) {
  const { buffer, entries, directoryOffset } = zipEntries(bytes);
  const document = entries.find((e) => e.name === "word/document.xml");
  if (!document) throw new Error("DOCX tidak memiliki word/document.xml.");
  const xml = readZipEntry(buffer, document, directoryOffset).toString("utf8");
  const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => {
    const paragraph = match[0]
      .replace(/<w:tab\s*\/>/g, "\t")
      .replace(/<w:br\s*\/>/g, "\n");
    const text = [...paragraph.matchAll(/<(?:w|m):t\b[^>]*>([\s\S]*?)<\/(?:w|m):t>/g)]
      .map((m) => decodeXml(m[1]))
      .join("");
    return text.replace(/\u00a0/g, " ").trim();
  });
  return paragraphs.filter(Boolean).join("\n");
}

const sectionMarkers: Array<[RegExp, keyof Draft["explanation"]]> = [
  [/^(?:understanding|pemahaman|apa yang ditanyakan)\s*:\s*(.*)$/i, "understanding_md"],
  [/^diketahui\s*:\s*(.*)$/i, "known_md"],
  [/^ditanyakan\s*:\s*(.*)$/i, "asked_md"],
  [/^konsep\s*:\s*(.*)$/i, "concept_md"],
  [/^(?:langkah pertama|first step)\s*:\s*(.*)$/i, "first_step_md"],
  [/^(?:pembahasan|penyelesaian|solution)\s*:\s*(.*)$/i, "solution_md"],
  [/^(?:jawaban akhir|final answer)\s*:\s*(.*)$/i, "final_answer_md"],
  [/^(?:shortcut|cara cepat|trik cepat)\s*:\s*(.*)$/i, "shortcut_md"],
  [/^(?:kesalahan umum|common mistake)\s*:\s*(.*)$/i, "common_mistake_md"],
  [/^(?:analisis opsi|option analysis)\s*:\s*(.*)$/i, "option_analysis_md"],
];

function splitQuestions(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const starts = lines.map((line, index) => (/^(?:soal\s*)?(\d{1,3})[.)]\s+(.+)$/i.test(line) ? index : -1)).filter((x) => x >= 0);
  if (!starts.length) return [lines];
  return starts.map((start, i) => lines.slice(start, starts[i + 1] ?? lines.length));
}

function parseQuestion(lines: string[], index: number, defaults: DocxDefaults): { row: ImportRow; warnings: string[] } {
  const raw: Record<string, string> = { source_format: "DOCX" };
  const draft = blankDraft();
  draft.section_id = defaults.section_id;
  draft.subtopic_id = defaults.subtopic_id;
  draft.difficulty = defaults.difficulty;
  draft.source_type = "DOCX";
  draft.source_title = defaults.source_title;
  draft.source_page = "";
  draft.code = "";
  const warnings: string[] = [];
  const errors: string[] = [];
  const first = lines[0]?.replace(/^(?:soal\s*)?\d{1,3}[.)]\s*/i, "") || "";
  const stem: string[] = first ? [first] : [];
  let explanationKey: keyof Draft["explanation"] | null = null;
  let currentOption: number | null = null;

  for (const original of lines.slice(1)) {
    const line = original.trim();
    const answer = line.match(/^(?:kunci(?:\s+jawaban)?|answer|jawaban)\s*:\s*([A-E])\b/i);
    if (answer) { raw.answer = answer[1].toUpperCase(); explanationKey = null; currentOption = null; continue; }
    const option = line.match(/^([A-E])[.)]\s*(.+)$/i);
    if (option) {
      const key = option[1].toUpperCase();
      const position = draft.options.findIndex((o) => o.option_key === key);
      if (position >= 0) draft.options[position].content_md = option[2].trim();
      currentOption = position;
      explanationKey = null;
      continue;
    }
    const instruction = line.match(/^instruksi\s*:\s*(.*)$/i);
    if (instruction) { draft.instruction_md = instruction[1]; currentOption = null; explanationKey = null; continue; }
    const stimulus = line.match(/^stimulus\s*:\s*(.*)$/i);
    if (stimulus) { draft.stimulus_md = stimulus[1]; currentOption = null; explanationKey = null; continue; }
    const question = line.match(/^(?:soal|pertanyaan|stem)\s*:\s*(.*)$/i);
    if (question) { stem.push(question[1]); currentOption = null; explanationKey = null; continue; }
    let matched = false;
    for (const [pattern, key] of sectionMarkers) {
      const match = line.match(pattern);
      if (match) {
        explanationKey = key;
        draft.explanation[key] = match[1]?.trim() || "";
        currentOption = null;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    if (explanationKey) {
      draft.explanation[explanationKey] = [draft.explanation[explanationKey], line].filter(Boolean).join("\n");
    } else if (currentOption !== null && currentOption >= 0) {
      draft.options[currentOption].content_md = [draft.options[currentOption].content_md, line].filter(Boolean).join("\n");
    } else {
      stem.push(line);
    }
  }

  draft.stem_md = stem.join("\n").trim();
  draft.options = draft.options.filter((o) => o.content_md.trim());
  const answer = raw.answer || "";
  draft.options = draft.options.map((o) => ({ ...o, is_correct: o.option_key === answer }));
  if (!draft.stem_md) errors.push("Pertanyaan utama tidak terdeteksi");
  if (draft.options.length < 4 || draft.options.length > 5) errors.push("Harus ada 4–5 opsi A–E");
  if (new Set(draft.options.map((o) => o.content_md.toLowerCase().trim())).size !== draft.options.length) errors.push("Opsi jawaban duplikat");
  if (!/[A-E]/.test(answer) || draft.options.filter((o) => o.is_correct).length !== 1) errors.push("Kunci jawaban A–E tidak ditemukan/invalid");
  if (!defaults.section_id || !defaults.subtopic_id) errors.push("Klasifikasi section/subtopic wajib dipilih sebelum import");
  if (!["BASIC", "MEDIUM", "HARD"].includes(defaults.difficulty)) errors.push("Difficulty tidak valid");

  const missingExplanation = explanationFields.filter(([key, , required]) => required && !draft.explanation[key]).map(([, label]) => label);
  if (missingExplanation.length) warnings.push(`Pembahasan perlu dilengkapi: ${missingExplanation.join(", ")}`);
  raw.stem = draft.stem_md;
  raw.answer = answer;
  raw.warnings = warnings.join("; ");
  return {
    row: {
      row_number: index + 1,
      raw,
      parsed: errors.length ? null : draft,
      status: errors.length ? "INVALID" : "VALID",
      error_message: errors.length ? errors.join("; ") : null,
    },
    warnings,
  };
}

export async function parseDocx(bytes: Uint8Array, catalog: Catalog, defaults: DocxDefaults): Promise<ImportPreview> {
  if (!catalog.sections.some((s) => s.id === defaults.section_id)) throw new Error("Section default tidak valid.");
  if (!catalog.subtopics.some((s) => s.id === defaults.subtopic_id)) throw new Error("Subtopic default tidak valid.");
  const text = extractDocxText(bytes);
  if (!text.trim()) throw new Error("DOCX tidak memiliki teks yang dapat dibaca.");
  const blocks = splitQuestions(text).filter((block) => block.some((line) => /^[A-E][.)]\s+/i.test(line)));
  if (!blocks.length) throw new Error("Tidak menemukan pola soal bernomor dengan opsi A–E. Gunakan format 1. Soal, A. opsi, ..., Kunci: A.");
  if (blocks.length > 200) throw new Error("Maksimal 200 soal per import.");
  const parsed = blocks.map((block, i) => parseQuestion(block, i, defaults));
  const rows = parsed.map((x) => x.row);
  return {
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((r) => r.status === "VALID").length,
      invalid: rows.filter((r) => r.status === "INVALID").length,
      skipped: 0,
      duplicate_codes: [],
      warnings: parsed.reduce((sum, x) => sum + x.warnings.length, 0),
      source_format: "DOCX",
    },
  };
}
