import Link from "next/link";
export default function AdminHome() {
  return (
    <section className="panel">
      <h1>Authoring konten V2</h1>
      <p>
        Draft → Review → QA Passed → Publish. Tidak ada konten generated yang
        aktif.
      </p>
      <Link href="/admin/questions">Buka Question Bank</Link>
      <p>
        Learning Builder, Tryout Builder dan PDF import belum termasuk fase ini.
      </p>
    </section>
  );
}
