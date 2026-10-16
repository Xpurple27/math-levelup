import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  Crosshair,
  Route,
  ScanSearch,
  Target,
  TrendingUp,
} from "lucide-react";
import { VectraBrand } from "./vectra-brand";

const loop = [
  ["01", "Diagnose", "Ukur posisi kemampuan awal dengan assessment terarah."],
  ["02", "Understand", "Lihat mastery, confidence, dan learning gap yang paling relevan."],
  ["03", "Learn", "Pelajari konsep berdasarkan kebutuhan, bukan urutan materi generik."],
  ["04", "Practice", "Latih area yang perlu diperkuat dengan pembahasan terstruktur."],
  ["05", "Measure", "Ukur perubahan lewat checkpoint, assessment, dan tryout."],
  ["06", "Advance ↗", "Gunakan bukti baru untuk menentukan arah belajar berikutnya."],
];

export function PublicHome() {
  return (
    <div className="public-site">
      <header className="public-nav">
        <VectraBrand inverse />
        <nav aria-label="Navigasi utama">
          <a href="#cara-kerja">How it works</a>
          <a href="#direction">Direction</a>
          <a href="#assessment">Assessment</a>
        </nav>
        <div className="public-nav-actions">
          <Link className="text-link" href="/login">Masuk</Link>
          <Link className="public-cta compact" href="/register">Mulai ↗</Link>
        </div>
      </header>

      <main id="content">
        <section className="vectra-public-hero">
          <div className="vectra-hero-copy">
            <span className="vectra-hero-eyebrow"><Crosshair size={15} /> LEARNING & ASSESSMENT PLATFORM</span>
            <h1>Know Your <span>Direction.</span></h1>
            <p>
              Pahami kemampuanmu, temukan learning gap, lalu tahu apa yang perlu dipelajari berikutnya. VECTRA Math menghubungkan diagnostic, learning, practice, assessment, dan progress dalam satu learning trajectory.
            </p>
            <div className="vectra-hero-actions">
              <Link className="public-cta" href="/register">Start Diagnostic ↗</Link>
              <a className="vectra-hero-secondary" href="#cara-kerja">Explore How It Works <ArrowRight size={16} /></a>
            </div>
            <div className="vectra-hero-proof">
              <span><ScanSearch size={15} /> Position</span>
              <span><Compass size={15} /> Direction</span>
              <span><TrendingUp size={15} /> Progress</span>
            </div>
          </div>

          <div className="vectra-trajectory" aria-label="Ilustrasi trajectory kemampuan VECTRA">
            <div className="vectra-grid-card" />
            <div className="trajectory-line" />
            <span className="trajectory-node node-a" />
            <span className="trajectory-node node-b" />
            <span className="trajectory-node node-c" />
            <div className="trajectory-label label-a"><strong>Current Position</strong><small>Mastery 48 · Confidence Low</small></div>
            <div className="trajectory-label label-b"><strong>Learning Gap</strong><small>Aljabar · Persamaan</small></div>
            <div className="trajectory-label label-c"><strong>Next Direction ↗</strong><small>Build mastery with evidence</small></div>
          </div>
        </section>

        <section className="vectra-section" id="direction">
          <div className="vectra-section-head">
            <span>POSITION → DIRECTION → PROGRESS</span>
            <h2>Nilai memberi hasil. VECTRA memberi konteks untuk langkah berikutnya.</h2>
            <p>
              VECTRA bukan sekadar tempat mengerjakan soal. Sistemnya membantu siswa membaca posisi kemampuan, memprioritaskan gap, dan membangun progress berdasarkan bukti belajar.
            </p>
          </div>
          <div className="vectra-three-grid">
            <article className="vectra-card">
              <span className="node" style={{ background: "#5C7CFA" }} />
              <Crosshair size={23} />
              <h3>Position</h3>
              <p>Ketahui mastery, confidence, dan area yang sudah atau belum memiliki cukup bukti.</p>
            </article>
            <article className="vectra-card">
              <span className="node" style={{ background: "#00D1B2" }} />
              <Route size={23} />
              <h3>Direction</h3>
              <p>Ubah learning gap menjadi rekomendasi belajar yang konkret dan bisa langsung dikerjakan.</p>
            </article>
            <article className="vectra-card">
              <span className="node" style={{ background: "#B7FF3C" }} />
              <TrendingUp size={23} />
              <h3>Progress</h3>
              <p>Gunakan latihan dan assessment berikutnya untuk melihat apakah kemampuan benar-benar bergerak.</p>
            </article>
          </div>
        </section>

        <section className="vectra-section alt" id="cara-kerja">
          <div className="vectra-section-head">
            <span>HOW VECTRA WORKS</span>
            <h2>Satu loop belajar yang selalu kembali ke bukti.</h2>
            <p>Setiap langkah memberi informasi baru agar siswa tidak belajar secara acak.</p>
          </div>
          <div className="vectra-loop-grid">
            {loop.map(([number, title, copy]) => (
              <div className="vectra-loop-step" key={number}>
                <small>{number}</small>
                <strong>{title}</strong>
                <small>{copy}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="vectra-section" id="assessment">
          <div className="vectra-section-head">
            <span>LEARNING INTELLIGENCE</span>
            <h2>Practice what matters.</h2>
            <p>
              Diagnostic memberi posisi awal. Learning Profile merangkum kekuatan dan learning gap. VECTRA Learn memberi arah. VECTRA Practice dan Assessment menghasilkan bukti baru untuk memperbarui trajectory.
            </p>
          </div>
          <div className="vectra-three-grid">
            <article className="vectra-card">
              <Target size={24} />
              <h3>VECTRA Diagnostic</h3>
              <p>Mulai dari kemampuan yang ada sekarang, bukan asumsi atau target akhir.</p>
            </article>
            <article className="vectra-card">
              <BarChart3 size={24} />
              <h3>VECTRA Profile</h3>
              <p>Mastery dan confidence dipisahkan agar skor tinggi tanpa cukup bukti tidak terlihat menyesatkan.</p>
            </article>
            <article className="vectra-card">
              <CheckCircle2 size={24} />
              <h3>VECTRA Assessment</h3>
              <p>Practice, checkpoint, dan tryout membantu mengukur apakah arah belajar menghasilkan progress.</p>
            </article>
          </div>
        </section>

        <section className="vectra-cta-band">
          <div>
            <h2>Know where you are. Know where to go next.</h2>
            <p>Mulai dari diagnostic pertama dan biarkan bukti menentukan arah belajarmu.</p>
          </div>
          <Link className="public-cta" href="/register">Start Diagnostic ↗</Link>
        </section>
      </main>

      <footer className="vectra-footer">
        <div className="mx-auto grid max-w-[1390px] gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-10 lg:px-14">
          <div>
            <VectraBrand inverse />
            <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
              VECTRA Math adalah learning & assessment platform untuk memahami kemampuan, menemukan gap, dan menentukan arah belajar berikutnya.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00D1B2]">Explore</p>
            <nav className="mt-5 flex flex-col gap-3 text-sm text-white/65" aria-label="Navigasi footer">
              <a href="#cara-kerja">How it works</a>
              <a href="#direction">Direction</a>
              <a href="#assessment">Assessment</a>
            </nav>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B7FF3C]">Start</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <Link href="/register">Buat akun</Link>
              <Link href="/login">Masuk</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/45">© 2026 VECTRA · Know Your Direction.</div>
      </footer>
    </div>
  );
}
