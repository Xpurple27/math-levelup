import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
export default function ReviewerHome() {
  return (
    <section className="ops-overview reviewer-home-clean">
      <div className="ops-page-head">
        <div>
          <span>QUALITY CONTROL</span>
          <h1>Review soal yang menunggu pemeriksaan.</h1>
          <p>
            Periksa isi soal, kunci, pembahasan, klasifikasi, dan kualitas opsi
            sebelum memberi keputusan.
          </p>
        </div>
      </div>
      <div className="reviewer-focus-grid single">
        <article>
          <ClipboardCheck size={22} />
          <h2>Review queue</h2>
          <p>
            Buka soal lengkap dan lakukan pemeriksaan pada konten yang
            benar-benar akan digunakan.
          </p>
          <Link href="/reviewer/queue">
            Buka antrean <ArrowRight size={16} />
          </Link>
        </article>
      </div>
    </section>
  );
}
