import Link from "next/link";
import { ArrowRight, FileSpreadsheet, LibraryBig, ShieldCheck } from "lucide-react";

export default function AdminHome() {
  return (
    <section className="ops-overview">
      <div className="ops-page-head">
        <div>
          <span>CONTENT OPERATIONS</span>
          <h1>Bangun konten yang layak dipakai siswa.</h1>
          <p>Fokus admin sekarang bukan menambah fitur. Fokusnya authoring, QA, import, dan publishing yang terkontrol.</p>
        </div>
        <Link className="ops-primary" href="/admin/questions/new">Buat soal baru <ArrowRight size={16} /></Link>
      </div>
      <div className="admin-overview-grid">
        <article>
          <LibraryBig size={22} />
          <h2>Question Bank</h2>
          <p>Tulis, klasifikasikan, preview KaTeX, buat revision, dan publish versi soal yang sudah lolos QA.</p>
          <Link href="/admin/questions">Buka bank soal <ArrowRight size={15} /></Link>
        </article>
        <article>
          <FileSpreadsheet size={22} />
          <h2>Excel import</h2>
          <p>Upload workbook, periksa error per baris, lalu import sebagai DRAFT. Tidak ada auto-publish.</p>
          <Link href="/admin/imports">Buka importer <ArrowRight size={15} /></Link>
        </article>
        <article>
          <ShieldCheck size={22} />
          <h2>Quality gate</h2>
          <p>Approval reviewer tetap terpisah dari publish agar kualitas matematika dan editorial tidak bergantung pada satu orang.</p>
          <Link href="/admin/qa">Lihat QA queue <ArrowRight size={15} /></Link>
        </article>
      </div>
      <div className="ops-phase-note">
        <strong>Fase saat ini</strong>
        <p>Learning Builder, Tryout Builder, PDF import, dan Drive integration belum dibuka. Kita stabilkan fondasi konten dan UX lebih dulu.</p>
      </div>
    </section>
  );
}
