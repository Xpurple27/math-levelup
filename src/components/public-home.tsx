import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ChartNoAxesCombined,
  GraduationCap,
  MoveUpRight,
  Target,
} from "lucide-react";

const steps = [
  [
    "01",
    "Diagnostic",
    "Kenali posisi awalmu sebelum memilih apa yang perlu dipelajari.",
  ],
  [
    "02",
    "Learn",
    "Pahami konsep dengan penjelasan yang terarah, bukan sekadar melihat kunci.",
  ],
  [
    "03",
    "Practice",
    "Latih subtopik yang lemah dengan soal yang relevan dan terukur.",
  ],
  [
    "04",
    "Tryout",
    "Uji kesiapanmu dalam sesi yang menyerupai tekanan ujian sebenarnya.",
  ],
];

export function PublicHome() {
  return (
    <div className="public-site">
      <header className="public-nav">
        <Link className="public-brand" href="/" aria-label="LevelUP Math">
          <span className="public-brand-mark">LU</span>
          <span>
            LevelUP <small>Math</small>
          </span>
        </Link>
        <nav aria-label="Navigasi utama">
          <a href="#cara-kerja">Cara belajar</a>
          <a href="#produk">Program</a>
          <a href="#tentang">Tentang</a>
        </nav>
        <div className="public-nav-actions">
          <Link className="text-link" href="/login">
            Masuk
          </Link>
          <Link className="public-cta compact" href="/register">
            Daftar gratis
          </Link>
        </div>
      </header>

      <main className="public-main" id="content">
        <section className="public-hero">
          <div className="public-hero-copy">
            <span className="public-kicker">
              MATEMATIKA UNTUK UTBK · BELAJAR DENGAN ARAH
            </span>
            <h1>
              Tahu <em>di mana kamu lemah.</em>
              <br />
              Tahu apa yang harus dilakukan berikutnya.
            </h1>
            <p>
              LevelUP Math menghubungkan diagnostik, pembelajaran, latihan,
              tryout, dan progres dalam satu perjalanan yang jelas. Bukan
              sekadar bank soal.
            </p>
            <div className="public-hero-actions">
              <Link className="public-cta" href="/register">
                Mulai dari diagnostik <ArrowRight size={18} />
              </Link>
              <a className="public-secondary" href="#cara-kerja">
                Lihat cara kerja
              </a>
            </div>
            <div className="public-proof">
              <span>
                <GraduationCap size={16} /> Fokus UTBK
              </span>
              <span>
                <BookOpenCheck size={16} /> Pembahasan terstruktur
              </span>
              <span>
                <ChartNoAxesCombined size={16} /> Progres berbasis bukti
              </span>
            </div>
          </div>
          <div className="public-hero-visual" aria-hidden="true">
            <div className="hero-number">700</div>
            <div className="hero-score-caption">
              TARGETMU BUKAN TITIK AWALMU
            </div>
            <div className="hero-signal-card hero-signal-a">
              <span>Aljabar</span>
              <strong>72</strong>
              <i>kuat</i>
            </div>
            <div className="hero-signal-card hero-signal-b">
              <span>Geometri</span>
              <strong>48</strong>
              <i>fokus berikutnya</i>
            </div>
            <div className="hero-math-glyph">∑</div>
            <div className="hero-arrow-line">
              <MoveUpRight size={44} />
            </div>
          </div>
        </section>

        <section className="public-manifesto" id="tentang">
          <p>
            Nilai hanya memberi tahu <strong>hasil.</strong>
          </p>
          <p>
            LevelUP dirancang untuk membantu siswa memahami{" "}
            <strong>mengapa</strong> hasil itu terjadi dan{" "}
            <strong>apa langkah berikutnya.</strong>
          </p>
        </section>

        <section className="public-process" id="cara-kerja">
          <div className="public-section-head">
            <span>CORE LOOP</span>
            <h2>
              Satu perjalanan belajar. Empat langkah yang saling terhubung.
            </h2>
          </div>
          <div className="process-grid">
            {steps.map(([index, title, copy]) => (
              <article className="process-item" key={index}>
                <span className="process-index">{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-product" id="produk">
          <div className="product-statement">
            <span className="public-kicker">
              BUKAN DASHBOARD YANG MENUMPUK ANGKA
            </span>
            <h2>Masuk, lihat fokusmu, lalu belajar.</h2>
            <p>
              Ruang siswa dibuat untuk menjawab satu pertanyaan sederhana setiap
              kali kamu membuka aplikasi:{" "}
              <strong>sekarang aku harus melakukan apa?</strong>
            </p>
            <Link className="public-secondary inline" href="/login">
              Sudah punya akun? Masuk <ArrowRight size={16} />
            </Link>
          </div>
          <div className="product-preview-card">
            <div className="preview-top">
              <span>FOKUS HARI INI</span>
              <Target size={18} />
            </div>
            <h3>Persamaan linear</h3>
            <p>Mastery 52% · 15 menit</p>
            <div className="preview-bar">
              <span />
            </div>
            <button type="button">
              Lanjutkan belajar <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <Link className="public-brand" href="/">
          <span className="public-brand-mark">LU</span>
          <span>
            LevelUP <small>Math</small>
          </span>
        </Link>
        <p>Belajar terarah. Penilaian transparan. Progres yang berarti.</p>
        <div>
          <Link href="/login">Masuk</Link>
          <Link href="/register">Daftar</Link>
        </div>
      </footer>
    </div>
  );
}
