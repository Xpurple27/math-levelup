import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";

export default function ReviewerHome() {
  return (
    <section className="ops-overview">
      <div className="ops-page-head">
        <div>
          <span>QUALITY CONTROL</span>
          <h1>Review yang fokus, bukan dashboard yang ramai.</h1>
          <p>
            Periksa soal yang sudah dikirim ke QA. Approval tidak langsung
            mem-publish konten.
          </p>
        </div>
      </div>
      <div className="reviewer-focus-grid">
        <article>
          <ClipboardCheck size={22} />
          <h2>Review queue</h2>
          <p>
            Periksa akurasi matematika, kunci, wording, taxonomy, difficulty,
            pembahasan, dan distraktor.
          </p>
          <Link href="/reviewer/queue">
            Buka antrean <ArrowRight size={16} />
          </Link>
        </article>
        <article>
          <CheckCircle2 size={22} />
          <h2>Independen</h2>
          <p>
            Reviewer harus berbeda dari creator atau editor terakhir. Approval
            tetap terpisah dari publish.
          </p>
        </article>
      </div>
    </section>
  );
}
