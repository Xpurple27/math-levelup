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
            <Link className="preview-action" href="/register">
              Mulai diagnostik <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-20 bg-[#7f1519] text-white">
        <div className="mx-auto grid max-w-[1390px] gap-12 px-6 py-14 md:grid-cols-[1.7fr_1fr_1fr] md:px-10 lg:px-14">
          <div className="max-w-xl">
            <Link
              className="inline-flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em]"
              href="/"
              aria-label="LevelUP Math"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5b82e] text-sm font-black text-[#7f1519]">
                LU
              </span>
              <span>
                LevelUP <span className="text-[#f5cf63]">Math</span>
              </span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/75">
              Platform belajar, latihan, dan tryout matematika untuk membantu
              siswa mengenali kemampuan, memperbaiki kelemahan, dan membangun
              progres yang terukur.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/80">
              {[
                "Diagnostic",
                "Learning",
                "Practice",
                "Tryout",
                "Progress",
              ].map((item) => (
                <span
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f5cf63]">
              Jelajahi
            </p>
            <nav className="mt-5 flex flex-col gap-3 text-sm text-white/75" aria-label="Navigasi footer">
              <a className="transition hover:text-white" href="#cara-kerja">
                Cara belajar
              </a>
              <a className="transition hover:text-white" href="#produk">
                Program
              </a>
              <a className="transition hover:text-white" href="#tentang">
                Tentang LevelUP
              </a>
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f5cf63]">
              Mulai belajar
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/75">
              <Link className="transition hover:text-white" href="/register">
                Daftar gratis
              </Link>
              <Link className="transition hover:text-white" href="/login">
                Masuk ke akun
              </Link>
              <Link
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg bg-[#f5b82e] px-4 py-2.5 font-bold text-[#6f1015] transition hover:brightness-105"
                href="/register"
              >
                Mulai LevelUP <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1390px] flex-col gap-2 px-6 py-5 text-xs text-white/55 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
            <span>© 2026 LevelUP Math.</span>
            <span>Belajar dengan arah. Naik level dengan bukti.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
