import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
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
          <a href="#product">Learning intelligence</a>
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
              Siswa tidak hanya perlu tahu benar atau salah. Mereka perlu tahu posisi kemampuan, seberapa kuat buktinya, bagian mana yang belum dikuasai, dan apa langkah berikutnya.
            </p>
          </div>
          <div className="vectra-three-grid">
            <article className="vectra-card">
              <span className="node vectra-node-blue" />
              <Crosshair size={23} />
              <h3>Position</h3>
              <p>Ketahui mastery, confidence, dan area yang sudah atau belum memiliki cukup bukti.</p>
            </article>
            <article className="vectra-card">
              <span className="node vectra-node-turquoise" />
              <Route size={23} />
              <h3>Direction</h3>
              <p>Ubah learning gap menjadi rekomendasi belajar yang konkret dan bisa langsung dikerjakan.</p>
            </article>
            <article className="vectra-card">
              <span className="node vectra-node-lime" />
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

        <section className="vectra-section" id="product">
          <div className="vectra-section-head">
            <span>LEARNING INTELLIGENCE</span>
            <h2>Dari hasil tes menjadi arah belajar yang bisa dikerjakan.</h2>
            <p>
              VECTRA menghubungkan assessment dengan learning profile dan rekomendasi. Bukan sekadar dashboard nilai, tetapi sistem untuk menentukan prioritas berikutnya.
            </p>
          </div>

          <div className="vectra-intelligence-grid">
            <article className="vectra-intelligence-card">
              <span className="vectra-feature-index">01</span>
              <h3>VECTRA Diagnostic</h3>
              <p>Bangun baseline kemampuan dari evidence pertama dan lihat domain mana yang perlu perhatian.</p>
              <div className="vectra-feature-meta">Position · baseline evidence</div>
            </article>
            <article className="vectra-intelligence-card turquoise">
              <span className="vectra-feature-index">02</span>
              <h3>VECTRA Profile</h3>
              <p>Mastery dan confidence dibaca terpisah agar skor tanpa bukti yang cukup tidak terlihat menyesatkan.</p>
              <div className="vectra-feature-meta">Mastery · Confidence · Learning Gap</div>
            </article>
            <article className="vectra-intelligence-card lime">
              <span className="vectra-feature-index">03</span>
              <h3>Next Direction ↗</h3>
              <p>Prioritaskan konsep dan domain yang paling relevan berdasarkan posisi kemampuan saat ini.</p>
              <div className="vectra-feature-meta">Recommended Learning · Learning Path</div>
            </article>
          </div>

          <div className="vectra-product-split">
            <div className="vectra-product-copy">
              <span className="public-kicker">LEARN → PRACTICE → MEASURE</span>
              <h3>Practice what matters, bukan sekadar mengerjakan lebih banyak soal.</h3>
              <p>
                Learning memberi konteks konsep. Practice membangun evidence. Assessment menguji apakah mastery benar-benar meningkat. Seluruhnya kembali ke learning profile yang sama.
              </p>
              <div className="vectra-product-list">
                <div><span>1</span><div><strong>VECTRA Learn</strong><small>Konsep, contoh, guided practice, checkpoint, dan mini assessment.</small></div></div>
                <div><span>2</span><div><strong>VECTRA Practice</strong><small>Practice set berdasarkan domain dengan pembahasan yang terstruktur.</small></div></div>
                <div><span>3</span><div><strong>VECTRA Progress</strong><small>Evidence baru memperbarui mastery, confidence, dan rekomendasi berikutnya.</small></div></div>
              </div>
            </div>

            <div className="vectra-profile-preview" aria-label="Contoh VECTRA Learning Profile">
              <div className="vectra-profile-top">
                <div><span>CURRENT POSITION</span><strong>Quantitative Profile</strong></div>
                <div className="vectra-profile-score"><strong>68</strong><small>Mastery</small></div>
              </div>
              <div className="vectra-profile-bars">
                <div className="vectra-profile-row">
                  <div><span>Bilangan</span><strong>82%</strong></div>
                  <div className="vectra-profile-track"><span style={{ width: "82%" }} /></div>
                </div>
                <div className="vectra-profile-row">
                  <div><span>Aljabar & Fungsi</span><strong>61%</strong></div>
                  <div className="vectra-profile-track"><span style={{ width: "61%" }} /></div>
                </div>
                <div className="vectra-profile-row">
                  <div><span>Analisis Data</span><strong>54%</strong></div>
                  <div className="vectra-profile-track"><span style={{ width: "54%" }} /></div>
                </div>
              </div>
              <div className="vectra-profile-direction">
                <div><span>NEXT DIRECTION</span><strong>Aljabar & Fungsi · Build stronger evidence</strong></div>
                <b>↗</b>
              </div>
            </div>
          </div>
        </section>

        <section className="vectra-section vectra-dark-section" id="assessment">
          <div className="vectra-section-head">
            <span>ASSESSMENT & PROGRESS</span>
            <h2>Measure the ability. Find the direction.</h2>
            <p>
              Practice dan learning saja tidak cukup. VECTRA menggunakan checkpoint, diagnostic, dan timed assessment untuk melihat apakah pemahaman bertahan ketika diuji kembali.
            </p>
          </div>
          <div className="vectra-measure-grid">
            <article className="vectra-measure-card">
              <Target size={25} />
              <h3>VECTRA Assessment</h3>
              <p>Kerjakan assessment dengan navigation, timer, review, scoring, dan pembahasan setelah sesi selesai.</p>
              <small>Diagnostic · Checkpoint · Mini Tryout · Tryout</small>
            </article>
            <article className="vectra-measure-card">
              <BarChart3 size={25} />
              <h3>VECTRA Progress</h3>
              <p>Bandingkan bukti dari waktu ke waktu untuk melihat domain yang menguat dan area yang masih membutuhkan arah baru.</p>
              <small>Mastery · Confidence · Evidence · Trajectory</small>
            </article>
          </div>
        </section>

        <section className="vectra-section">
          <div className="vectra-section-head">
            <span>BUILT FOR FOCUSED LEARNING</span>
            <h2>Lebih sedikit noise. Lebih jelas langkah berikutnya.</h2>
            <p>VECTRA memprioritaskan informasi yang membantu keputusan belajar, bukan dekorasi, leaderboard, atau jumlah fitur yang tidak mengubah arah belajar.</p>
          </div>
          <div className="vectra-three-grid">
            <article className="vectra-card"><BookOpenCheck size={24} /><h3>Structured learning</h3><p>Materi dibangun dari konsep menuju evidence, bukan hanya daftar video atau catatan.</p></article>
            <article className="vectra-card"><CheckCircle2 size={24} /><h3>Readable explanations</h3><p>Pembahasan menjelaskan konsep, langkah, kesalahan umum, dan shortcut ketika memang relevan.</p></article>
            <article className="vectra-card"><Compass size={24} /><h3>One next direction</h3><p>Rekomendasi dibuat agar siswa tahu apa yang paling layak dikerjakan berikutnya.</p></article>
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
              <a href="#product">Learning intelligence</a>
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
