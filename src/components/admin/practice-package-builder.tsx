"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Eye, Plus, Save, Search, Send, X } from "lucide-react";

type Section = { id: string; code: string; name: string };
type Subtopic = {
  id: string;
  name: string;
  topics?: { id: string; name: string; domains?: { id: string; name: string } | null } | null;
};
type Question = {
  id: string;
  code: string;
  version_id: string;
  stem_md: string;
  difficulty: "BASIC" | "MEDIUM" | "HARD";
  section_id: string;
  section: string;
  subtopic_id: string;
  subtopic: string;
  topic: string;
  domain: string;
};
type Package = {
  id: string;
  section_id: string;
  subtopic_id: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  estimated_minutes: number;
  practice_package_questions?: { id: string; question_version_id: string; sort_order: number }[];
};
type Payload = { packages: Package[]; sections: Section[]; subtopics: Subtopic[]; questions: Question[] };

const empty: Payload = { packages: [], sections: [], subtopics: [], questions: [] };

export function PracticePackageBuilder() {
  const [data, setData] = useState<Payload>(empty);
  const [selectedId, setSelectedId] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    section_id: "",
    subtopic_id: "",
    access: "FREE",
    estimated_minutes: 15,
  });

  async function load() {
    const response = await fetch("/api/admin/practice-packages", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Gagal memuat paket latihan.");
    setData(json.data);
    setSelectedId((current) => current || json.data.packages[0]?.id || "");
  }

  useEffect(() => {
    void load().catch((error: Error) => setMessage(error.message));
  }, []);

  const current = data.packages.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!current) return;
    setForm({
      title: current.title,
      description: current.description || "",
      section_id: current.section_id,
      subtopic_id: current.subtopic_id,
      access: current.access,
      estimated_minutes: current.estimated_minutes,
    });
    setSelectedQuestions(
      [...(current.practice_package_questions || [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => item.question_version_id),
    );
  }, [current?.id]);

  async function post(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/practice-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Perubahan gagal disimpan.");
      return json.data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Perubahan gagal disimpan.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const eligibleQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.questions.filter((question) => {
      if (question.section_id !== form.section_id || question.subtopic_id !== form.subtopic_id) return false;
      if (!query) return true;
      return [question.code, question.stem_md, question.topic, question.subtopic, question.domain]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [data.questions, form.section_id, form.subtopic_id, search]);

  const selectedRows = selectedQuestions
    .map((id) => data.questions.find((question) => question.version_id === id))
    .filter(Boolean) as Question[];
  const mix = {
    basic: selectedRows.filter((q) => q.difficulty === "BASIC").length,
    medium: selectedRows.filter((q) => q.difficulty === "MEDIUM").length,
    hard: selectedRows.filter((q) => q.difficulty === "HARD").length,
  };

  async function createPackage() {
    const created = await post("create_package", form);
    if (!created) return;
    await load();
    setSelectedId(created.id);
    setMessage("Paket draft berhasil dibuat. Tambahkan 5–10 soal.");
  }

  async function savePackage() {
    if (!current) return;
    const updated = await post("update_package", { id: current.id, ...form });
    if (!updated) return;
    const saved = await post("save_questions", {
      package_id: current.id,
      question_version_ids: selectedQuestions,
    });
    if (!saved) return;
    await load();
    setMessage("Paket dan susunan soal berhasil disimpan.");
  }

  async function publish() {
    if (!current) return;
    const saved = await post("save_questions", {
      package_id: current.id,
      question_version_ids: selectedQuestions,
    });
    if (!saved) return;
    const result = await post(current.status === "PUBLISHED" ? "unpublish_package" : "publish_package", { id: current.id });
    if (!result) return;
    await load();
    setMessage(current.status === "PUBLISHED" ? "Paket dikembalikan ke Draft." : "Paket dipublish dan sekarang dapat muncul ke siswa.");
  }

  function toggleQuestion(id: string) {
    setSelectedQuestions((rows) => {
      if (rows.includes(id)) return rows.filter((item) => item !== id);
      if (rows.length >= 10) {
        setMessage("Maksimal 10 soal dalam satu paket latihan.");
        return rows;
      }
      return [...rows, id];
    });
  }

  function choosePackage(item: Package) {
    setSelectedId(item.id);
    setMessage("");
  }

  const canCreate = form.title.trim() && form.section_id && form.subtopic_id;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs font-black tracking-[0.18em] text-[#a3262f]">PRACTICE PACKAGE BUILDER</span>
          <h1 className="mt-2 text-3xl font-black text-[#241d1e]">Rakit paket yang benar-benar dikerjakan siswa.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#79696b]">Pilih PK/PM/PU, subtopik, lalu susun 5–10 soal published dari Question Bank. Paket yang dipublish langsung masuk katalog Latihan.</p>
        </div>
        <div className="rounded-2xl border border-[#ead9db] bg-[#fffaf6] px-4 py-3 text-xs text-[#6f5558]">
          Target produksi: <strong>10 soal = 4 Basic · 3 Medium · 3 Hard</strong>
        </div>
      </div>

      {message && <div className="rounded-xl border border-[#ead9db] bg-white px-4 py-3 text-sm font-semibold text-[#5b3b3e]">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#eadfe0] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm">Paket latihan</strong>
            <span className="text-xs text-[#8b7779]">{data.packages.length}</span>
          </div>
          <div className="space-y-2">
            {data.packages.map((item) => (
              <button
                key={item.id}
                onClick={() => choosePackage(item)}
                className={`w-full rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-[#a3262f] bg-[#fff4f3]" : "border-[#eee4e5] hover:border-[#d8bfc2]"}`}
              >
                <strong className="block text-sm text-[#2f2425]">{item.title}</strong>
                <span className="mt-1 block text-xs text-[#8b7779]">{item.status} · {item.practice_package_questions?.length || 0} soal</span>
              </button>
            ))}
            {!data.packages.length && <p className="text-sm text-[#8b7779]">Belum ada paket.</p>}
          </div>
        </aside>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#eadfe0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#a3262f]">01 · IDENTITAS PAKET</span>
                <h2 className="mt-1 text-xl font-black">{current ? "Edit paket" : "Buat paket baru"}</h2>
              </div>
              {current && <span className={`rounded-full px-3 py-1 text-xs font-black ${current.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{current.status}</span>}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">Judul paket
                <input className="mt-1 w-full rounded-xl border border-[#e4d8d9] px-3 py-2.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Persamaan Linear · Paket 02" />
              </label>
              <label className="text-sm font-semibold">Bagian UTBK
                <select className="mt-1 w-full rounded-xl border border-[#e4d8d9] px-3 py-2.5" value={form.section_id} onChange={(e) => { setForm({ ...form, section_id: e.target.value }); setSelectedQuestions([]); }}>
                  <option value="">Pilih PK / PM / PU</option>
                  {data.sections.map((section) => <option key={section.id} value={section.id}>{section.code} — {section.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Subtopik
                <select className="mt-1 w-full rounded-xl border border-[#e4d8d9] px-3 py-2.5" value={form.subtopic_id} onChange={(e) => { setForm({ ...form, subtopic_id: e.target.value }); setSelectedQuestions([]); }}>
                  <option value="">Pilih materi</option>
                  {data.subtopics.map((subtopic) => (
                    <option key={subtopic.id} value={subtopic.id}>
                      {subtopic.topics?.domains?.name ? `${subtopic.topics.domains.name} · ` : ""}{subtopic.topics?.name ? `${subtopic.topics.name} · ` : ""}{subtopic.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Akses
                  <select className="mt-1 w-full rounded-xl border border-[#e4d8d9] px-3 py-2.5" value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })}>
                    <option value="FREE">Free</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">Estimasi
                  <div className="relative mt-1"><Clock3 size={15} className="absolute left-3 top-3 text-[#9a8386]" /><input className="w-full rounded-xl border border-[#e4d8d9] py-2.5 pl-9 pr-3" type="number" min="1" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) })} /></div>
                </label>
              </div>
            </div>
            <label className="mt-3 block text-sm font-semibold">Deskripsi
              <textarea className="mt-1 min-h-24 w-full rounded-xl border border-[#e4d8d9] px-3 py-2.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Apa yang dilatih siswa dalam paket ini?" />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {!current ? (
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#92232b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40" disabled={busy || !canCreate} onClick={() => void createPackage()}><Plus size={16} /> Buat draft paket</button>
              ) : (
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#92232b] px-4 py-2.5 text-sm font-bold text-white" disabled={busy} onClick={() => void savePackage()}><Save size={16} /> Simpan paket</button>
              )}
            </div>
          </section>

          {current && (
            <section className="rounded-2xl border border-[#eadfe0] bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="text-xs font-bold text-[#a3262f]">02 · SUSUN SOAL</span>
                  <h2 className="mt-1 text-xl font-black">{selectedQuestions.length}/10 soal dipilih</h2>
                  <p className="mt-1 text-sm text-[#7d6a6d]">Basic {mix.basic} · Medium {mix.medium} · Hard {mix.hard}</p>
                </div>
                <div className="relative min-w-[260px]"><Search size={16} className="absolute left-3 top-3 text-[#9a8386]" /><input className="w-full rounded-xl border border-[#e4d8d9] py-2.5 pl-9 pr-3 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode atau isi soal..." /></div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-black">Question Bank yang sesuai</h3>
                  <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                    {eligibleQuestions.map((question) => {
                      const selected = selectedQuestions.includes(question.version_id);
                      return (
                        <button key={question.version_id} onClick={() => toggleQuestion(question.version_id)} className={`w-full rounded-xl border p-3 text-left ${selected ? "border-[#a3262f] bg-[#fff4f3]" : "border-[#eee4e5] hover:border-[#d8bfc2]"}`}>
                          <div className="flex items-start justify-between gap-3"><strong className="text-sm">{question.code}</strong><span className="rounded-full bg-[#f4efef] px-2 py-1 text-[10px] font-black">{question.difficulty}</span></div>
                          <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#5f4c4f]">{question.stem_md}</p>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#9c3038]">{selected ? <><Check size={13} /> Dipilih</> : <><Plus size={13} /> Tambahkan</>}</span>
                        </button>
                      );
                    })}
                    {!eligibleQuestions.length && <p className="rounded-xl bg-[#faf7f5] p-4 text-sm text-[#8b7779]">Belum ada soal published yang cocok dengan bagian dan subtopik ini.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-black">Isi paket</h3>
                  <div className="space-y-2">
                    {selectedRows.map((question, index) => (
                      <div key={question.version_id} className="flex items-start gap-3 rounded-xl border border-[#eee4e5] p-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f5eded] text-xs font-black">{index + 1}</span>
                        <div className="min-w-0 flex-1"><strong className="text-sm">{question.code}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6e5a5d]">{question.stem_md}</p></div>
                        <button className="rounded-lg p-1.5 text-[#9a5960] hover:bg-[#fff0ef]" onClick={() => toggleQuestion(question.version_id)} aria-label={`Hapus ${question.code}`}><X size={15} /></button>
                      </div>
                    ))}
                    {!selectedRows.length && <p className="rounded-xl bg-[#faf7f5] p-4 text-sm text-[#8b7779]">Pilih 5–10 soal dari Question Bank.</p>}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee4e5] pt-4">
                <div className="text-xs text-[#7d6a6d]">Publish hanya aktif jika paket memiliki 5–10 soal yang sesuai taxonomy.</div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-[#d8c6c8] px-4 py-2.5 text-sm font-bold" disabled={busy} onClick={() => void savePackage()}><Save size={15} /> Simpan</button>
                  <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${current.status === "PUBLISHED" ? "bg-[#705b5e]" : "bg-[#92232b]"}`} disabled={busy || (current.status !== "PUBLISHED" && (selectedQuestions.length < 5 || selectedQuestions.length > 10))} onClick={() => void publish()}>
                    {current.status === "PUBLISHED" ? <><Eye size={15} /> Kembalikan ke Draft</> : <><Send size={15} /> Publish ke Latihan</>}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
