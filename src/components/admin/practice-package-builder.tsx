"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Clock3, Plus, Save, Search, Send, X } from "lucide-react";

type Section = { id: string; code: string; name: string };
type Domain = { id: string; code: string; name: string; description: string; sort_order: number };
type Question = {
  id: string;
  code: string;
  version_id: string;
  status: string;
  stem_md: string;
  difficulty: "BASIC" | "MEDIUM" | "HARD";
  section_id: string;
  section: string;
  domain_id: string;
  domain: string;
  subtopic_id: string;
  subtopic: string;
};
type Membership = { id: string; question_version_id: string; sort_order: number };
type Package = {
  id: string;
  section_id: string;
  domain_id: string | null;
  code: string;
  slug: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  estimated_minutes: number;
  sort_order: number;
  published_at: string | null;
  practice_package_questions: Membership[];
};
type Payload = { packages: Package[]; domains: Domain[]; sections: Section[]; questions: Question[] };

type Form = {
  section_id: string;
  domain_id: string;
  title: string;
  description: string;
  access: "FREE" | "PREMIUM";
  estimated_minutes: number;
};

const blankForm: Form = {
  section_id: "",
  domain_id: "",
  title: "",
  description: "",
  access: "FREE",
  estimated_minutes: 15,
};

function domainBelongsToSection(domain: Domain, sectionCode: string) {
  return domain.code.startsWith(`${sectionCode}_`);
}

function shortStem(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 110 ? `${clean.slice(0, 107)}…` : clean;
}

export function PracticePackageBuilder() {
  const [data, setData] = useState<Payload | null>(null);
  const [activeId, setActiveId] = useState("");
  const [form, setForm] = useState<Form>(blankForm);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load(preferredId?: string) {
    setError("");
    const response = await fetch("/api/admin/practice-packages", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Practice Package Builder gagal dimuat.");
    const next = json.data as Payload;
    setData(next);
    const targetId = preferredId || activeId || next.packages.find((item) => item.status !== "ARCHIVED")?.id || "";
    if (targetId) choosePackage(targetId, next);
    else {
      const firstSection = next.sections[0];
      const firstDomain = next.domains.find((item) => firstSection && domainBelongsToSection(item, firstSection.code));
      setForm({ ...blankForm, section_id: firstSection?.id || "", domain_id: firstDomain?.id || "" });
      setSelected([]);
      setActiveId("");
    }
  }

  useEffect(() => {
    void load().catch((reason: Error) => setError(reason.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choosePackage(id: string, source = data) {
    if (!source) return;
    const current = source.packages.find((item) => item.id === id);
    if (!current) return;
    setActiveId(id);
    setForm({
      section_id: current.section_id,
      domain_id: current.domain_id || "",
      title: current.title,
      description: current.description,
      access: current.access,
      estimated_minutes: current.estimated_minutes,
    });
    setSelected(
      [...(current.practice_package_questions || [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => item.question_version_id),
    );
    setNotice("");
    setError("");
  }

  const sectionCode = data?.sections.find((item) => item.id === form.section_id)?.code || "";
  const availableDomains = useMemo(
    () => (data?.domains || []).filter((item) => domainBelongsToSection(item, sectionCode)),
    [data, sectionCode],
  );
  const activePackage = data?.packages.find((item) => item.id === activeId);
  const selectedQuestions = selected
    .map((id) => data?.questions.find((question) => question.version_id === id))
    .filter(Boolean) as Question[];
  const mix = selectedQuestions.reduce(
    (acc, question) => {
      acc[question.difficulty] += 1;
      return acc;
    },
    { BASIC: 0, MEDIUM: 0, HARD: 0 },
  );
  const eligible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.questions || [])
      .filter((question) => question.section_id === form.section_id && question.domain_id === form.domain_id)
      .filter((question) => !selected.includes(question.version_id))
      .filter((question) => !query || `${question.code} ${question.stem_md} ${question.subtopic}`.toLowerCase().includes(query));
  }, [data, form.domain_id, form.section_id, search, selected]);

  async function action(actionName: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/practice-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, payload }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Perubahan gagal disimpan.");
      return json.data as { id?: string };
    } finally {
      setBusy(false);
    }
  }

  async function createPackage() {
    if (!form.title.trim() || !form.section_id || !form.domain_id) {
      setError("Bagian UTBK, pintu/domain, dan judul wajib diisi.");
      return;
    }
    try {
      const created = await action("create_package", form);
      setNotice("Draft paket dibuat. Tambahkan tepat 10 soal sebelum publish.");
      await load(created.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Paket gagal dibuat.");
    }
  }

  async function savePackage() {
    if (!activeId) return createPackage();
    try {
      await action("update_package", { id: activeId, ...form });
      await action("save_questions", { package_id: activeId, question_version_ids: selected });
      setNotice("Metadata dan susunan soal tersimpan.");
      await load(activeId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Paket gagal disimpan.");
    }
  }

  async function publishPackage() {
    if (!activeId) return;
    if (selected.length !== 10) {
      setError("Paket V2 harus berisi tepat 10 soal sebelum publish.");
      return;
    }
    try {
      await savePackage();
      await action("publish_package", { id: activeId });
      setNotice("Paket dipublikasikan ke katalog siswa.");
      await load(activeId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Paket gagal dipublish.");
    }
  }

  async function unpublishPackage() {
    if (!activeId) return;
    try {
      await action("unpublish_package", { id: activeId });
      setNotice("Paket dikembalikan menjadi draft.");
      await load(activeId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status paket gagal diubah.");
    }
  }

  function changeSection(sectionId: string) {
    const code = data?.sections.find((item) => item.id === sectionId)?.code || "";
    const firstDomain = data?.domains.find((item) => domainBelongsToSection(item, code));
    setForm((current) => ({ ...current, section_id: sectionId, domain_id: firstDomain?.id || "" }));
    setSelected([]);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= selected.length) return;
    setSelected((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[#eadfe0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#a52b31]">Assessment</div>
            <h2 className="mt-1 font-extrabold text-[#302426]">Practice Packages</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const firstSection = data?.sections[0];
              const firstDomain = data?.domains.find((item) => firstSection && domainBelongsToSection(item, firstSection.code));
              setActiveId("");
              setSelected([]);
              setForm({ ...blankForm, section_id: firstSection?.id || "", domain_id: firstDomain?.id || "" });
              setNotice("");
              setError("");
            }}
            className="rounded-xl bg-[#fff0ee] p-2.5 text-[#9e2027] hover:bg-[#f9dfdc]"
            title="Paket baru"
          >
            <Plus size={17} />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {(data?.packages || []).filter((item) => item.status !== "ARCHIVED").map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choosePackage(item.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${activeId === item.id ? "border-[#d95d63] bg-[#fff2ef]" : "border-[#eee3e4] hover:border-[#d8b9bc]"}`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9d8588]">{item.code}</div>
              <div className="mt-1 text-sm font-extrabold text-[#3c3032]">{item.title}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-[#866f72]">
                <span>{item.practice_package_questions?.length || 0}/10 soal</span>
                <span className={item.status === "PUBLISHED" ? "text-[#547052]" : "text-[#a57524]"}>{item.status}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="space-y-5">
        <section className="rounded-2xl border border-[#eadfe0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#a52b31]">DOMAIN-FIRST BUILDER</div>
              <h1 className="mt-1 text-xl font-black text-[#302426]">{activeId ? form.title || "Edit paket" : "Buat paket latihan baru"}</h1>
              <p className="mt-1 text-sm leading-6 text-[#806d6f]">Satu paket berisi tepat 10 soal dari satu pintu/domain, tetapi boleh mencampur banyak submateri di dalamnya.</p>
            </div>
            {activePackage && (
              <span className={`rounded-full px-3 py-1.5 text-xs font-black ${activePackage.status === "PUBLISHED" ? "bg-[#eef6ed] text-[#547052]" : "bg-[#fff5da] text-[#8a6922]"}`}>{activePackage.status}</span>
            )}
          </div>

          {error && <div className="mt-4 rounded-xl border border-[#efcdd0] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#8f1d24]">{error}</div>}
          {notice && <div className="mt-4 rounded-xl border border-[#dce9d9] bg-[#f4faf2] px-4 py-3 text-sm font-semibold text-[#547052]">{notice}</div>}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-[#5e4a4d]">Bagian UTBK
              <select value={form.section_id} onChange={(event) => changeSection(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ddcfd1] bg-white px-3 py-3 font-medium">
                {(data?.sections || []).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-[#5e4a4d]">Pintu/domain
              <select value={form.domain_id} onChange={(event) => { setForm((current) => ({ ...current, domain_id: event.target.value })); setSelected([]); }} className="mt-2 w-full rounded-xl border border-[#ddcfd1] bg-white px-3 py-3 font-medium">
                {availableDomains.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-[#5e4a4d]">Judul paket
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Bilangan · Paket 03" className="mt-2 w-full rounded-xl border border-[#ddcfd1] px-3 py-3 font-medium" />
            </label>
            <label className="text-sm font-bold text-[#5e4a4d]">Estimasi waktu
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#ddcfd1] px-3"><Clock3 size={16} className="text-[#9a8587]" /><input type="number" min={1} value={form.estimated_minutes} onChange={(event) => setForm((current) => ({ ...current, estimated_minutes: Number(event.target.value) }))} className="w-full py-3 outline-none" /><span className="text-xs text-[#8b7476]">menit</span></div>
            </label>
            <label className="md:col-span-2 text-sm font-bold text-[#5e4a4d]">Deskripsi
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={2} className="mt-2 w-full resize-none rounded-xl border border-[#ddcfd1] px-3 py-3 font-medium" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => void savePackage()} className="flex items-center gap-2 rounded-xl bg-[#34272a] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"><Save size={16} /> {activeId ? "Simpan paket" : "Buat draft"}</button>
            {activePackage?.status === "PUBLISHED" ? (
              <button disabled={busy} onClick={() => void unpublishPackage()} className="rounded-xl border border-[#d9c7c9] bg-white px-4 py-2.5 text-sm font-extrabold text-[#7b6467] disabled:opacity-50">Kembalikan ke Draft</button>
            ) : activeId ? (
              <button disabled={busy || selected.length !== 10} onClick={() => void publishPackage()} className="flex items-center gap-2 rounded-xl bg-[#8f1d24] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-40"><Send size={16} /> Publish 10 soal</button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#eadfe0] bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div><div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#a52b31]">QUESTION BANK</div><h2 className="mt-1 font-extrabold text-[#302426]">Soal dalam pintu yang sama</h2></div>
              <span className="text-xs font-bold text-[#8a7375]">{eligible.length} tersedia</span>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#ddcfd1] px-3"><Search size={16} className="text-[#9a8587]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode, stem, submateri..." className="w-full py-2.5 text-sm outline-none" /></div>
            <div className="mt-4 max-h-[560px] space-y-2 overflow-auto pr-1">
              {eligible.map((question) => (
                <button key={question.version_id} type="button" disabled={selected.length >= 10} onClick={() => setSelected((current) => [...current, question.version_id])} className="w-full rounded-xl border border-[#eee3e4] p-3 text-left transition hover:border-[#d8b9bc] disabled:opacity-40">
                  <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-black text-[#8f1d24]">{question.code}</span><span className="rounded-md bg-[#f6f1f1] px-2 py-1 text-[10px] font-bold text-[#7d696b]">{question.difficulty}</span></div>
                  <p className="mt-2 text-sm leading-5 text-[#4f3f41]">{shortStem(question.stem_md)}</p>
                  <p className="mt-2 text-[11px] font-semibold text-[#988184]">{question.subtopic}</p>
                </button>
              ))}
              {!eligible.length && <p className="py-8 text-center text-sm text-[#8c7779]">Tidak ada soal yang cocok dengan filter pintu ini.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-[#eadfe0] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#a52b31]">SUSUNAN PAKET</div><h2 className="mt-1 font-extrabold text-[#302426]">{selected.length}/10 soal</h2></div>
              <div className="flex gap-1.5 text-[10px] font-black"><span className="rounded-md bg-[#eef6ed] px-2 py-1 text-[#547052]">B {mix.BASIC}</span><span className="rounded-md bg-[#fff5da] px-2 py-1 text-[#8a6922]">M {mix.MEDIUM}</span><span className="rounded-md bg-[#fdebed] px-2 py-1 text-[#9a3d45]">H {mix.HARD}</span></div>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#897477]">Target produksi LevelUP: 4 Basic · 3 Medium · 3 Hard. Urutan di bawah menjadi urutan soal siswa.</p>
            <div className="mt-4 space-y-2">
              {selectedQuestions.map((question, index) => (
                <div key={question.version_id} className="flex items-start gap-3 rounded-xl border border-[#eee3e4] bg-[#fffdfc] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff0ee] text-xs font-black text-[#9e2027]">{index + 1}</span>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[11px] font-black text-[#6d575a]">{question.code}</span><span className="text-[10px] font-bold text-[#9a8587]">{question.difficulty}</span></div><p className="mt-1 text-xs leading-5 text-[#57474a]">{shortStem(question.stem_md)}</p><p className="mt-1 text-[10px] font-semibold text-[#a08b8d]">{question.subtopic}</p></div>
                  <div className="flex shrink-0 gap-1"><button type="button" onClick={() => move(index, -1)} className="rounded-lg border border-[#e5d8da] p-1.5 text-[#806d6f] disabled:opacity-30" disabled={index === 0}><ArrowUp size={13} /></button><button type="button" onClick={() => move(index, 1)} className="rounded-lg border border-[#e5d8da] p-1.5 text-[#806d6f] disabled:opacity-30" disabled={index === selected.length - 1}><ArrowDown size={13} /></button><button type="button" onClick={() => setSelected((current) => current.filter((id) => id !== question.version_id))} className="rounded-lg border border-[#efcdd0] p-1.5 text-[#9e2027]"><X size={13} /></button></div>
                </div>
              ))}
              {!selected.length && <div className="rounded-xl border border-dashed border-[#ddcfd1] px-4 py-10 text-center text-sm text-[#8c7779]">Pilih soal dari Question Bank. Submateri boleh berbeda selama masih di pintu/domain yang sama.</div>}
            </div>
            {selected.length === 10 && mix.BASIC === 4 && mix.MEDIUM === 3 && mix.HARD === 3 && <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f0f8ee] px-3 py-2.5 text-xs font-extrabold text-[#547052]"><Check size={15} /> Distribusi 4 Basic · 3 Medium · 3 Hard terpenuhi.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
