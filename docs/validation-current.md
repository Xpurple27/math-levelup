# Validation — VECTRA learning loop, 27 Oktober 2026

Status: **terverifikasi lokal; acceptance akun dan alur konten produksi belum selesai**. Tidak ada klaim siswa nyata, peningkatan belajar atau kesiapan produksi.

## Versi dan lingkungan

- Main dan deployment publik saat diperiksa: `2c20c6fef00e0bbc9d116046eacd0b9fc4445f5a`.
- Patch dibangun di atas PR #17 / `f0a09ea26fe9212ba16040756ddfb7d5605d9085`, branch lokal `fix/vectra-verified-learning-loop`.
- Node 24.22.1; Next.js 16.3.8; Playwright terpasang dari lockfile.
- Auth/attempt lokal: SQLite; normalized content serta replay RPC/migration: PostgreSQL/PGlite.
- Chromium 153.0.8010.0 untuk E2E lokal. Unduhan browser Playwright melalui CDN gagal/truncated pada lingkungan ini; binary diperoleh dari paket sementara `@sparticuz/chromium@153.0.0`, di luar dependency proyek. CI tetap memakai browser yang diinstal Playwright.
- Fixture TEST_ONLY memakai direktori temporer baru per run. Tidak menghubungi Supabase produksi, tidak mengubah data siswa. `LEVELUP_E2E_PRODUCTION=1` memilih `next start` dari build lokal.

## Pemeriksaan

| Perintah / pemeriksaan                  | Hasil                                               | Cakupan dan batas                                                                                                                                |
| --------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run format:check`                  | Lulus                                               | Termasuk koreksi format file yang telah gagal pada baseline; CSS yang hanya diformat tidak didesain ulang                                        |
| `npm run lint`                          | Lulus, 0 error / 5 warning                          | Warning yang tersisa: tiga raw image pada admin/reviewer dan dua navigasi internal existing; aturan tidak dimatikan                              |
| `npm run typecheck`                     | Lulus                                               | Termasuk tipe cookie proxy dan data lesson/package                                                                                               |
| `npm test`                              | **66/66 lulus**, 14 file                            | Scoring, unique evidence, storage/ownership/revision/expiry/idempotency, migrations, workflow QA, import, rendering, readiness dan proxy cookies |
| `npm run build`                         | Lulus                                               | Build produksi lokal; bukan bukti kesehatan akun produksi                                                                                        |
| E2E build lokal                         | **16/16 lulus**                                     | Desktop 1280px dan HP 390px; alur lengkap, akses, expiry, QA, tiga section suite dan pemisahan ringkasan akun                                    |
| `npm run audit:repository`              | Lulus, 0 temuan pola                                | Pemeriksaan pola repository/histori, bukan jaminan absolut tidak ada data sensitif                                                               |
| `git diff --check`                      | Lulus                                               | Whitespace/diff hygiene                                                                                                                          |
| `supabase/verify-vectra-readiness.sql`  | Berhasil pada proyek produksi yang tepat, read-only | Inventaris 245 current questions, 113 IN_REVIEW, 140 referensi MT current; tidak mengubah status/approval                                        |
| Audit struktur 140 soal MT              | Selesai, dua flag analisis huruf untuk review       | Bukan sertifikasi matematis; ekuivalensi aljabar memerlukan pemeriksaan manual                                                                   |
| Render export melalui komponen aplikasi | **2.037 field; 267 field KaTeX; 0 error**           | 140 versi MT aktual; rendering tidak membuktikan kunci benar                                                                                     |

Command E2E di lingkungan ini:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/tmp/vectra-chromium \
LEVELUP_E2E_PRODUCTION=1 VECTRA_CAPTURE_EVIDENCE=1 npm run test:e2e
```

Path binary sementara adalah detail lingkungan pengujian, bukan konfigurasi aplikasi/CI yang harus disalin. Pada mesin biasa gunakan `npx playwright install chromium`, lalu `LEVELUP_E2E_PRODUCTION=1 npm run test:e2e` setelah build.

Audit export editorial yang tidak dipublikasikan sebagai asset client:

```sh
node scripts/audit-content-export.mjs input.json report.json
VECTRA_QA_EXPORT=/path/to/editorial-export.json \
VECTRA_QA_RENDER_REPORT=/path/to/render-report.json \
npx vitest run tests/unit/content-export.test.ts
```

## Alur browser yang benar-benar diuji

Dua ukuran layar menjalankan pendaftaran → diagnostic → simpan/reload → logout/login → lanjutkan ID attempt dan deadline yang sama → submit → hasil/pembahasan → alasan rekomendasi → materi terkait → practice terkait → mini → hasil/paparan soal → progres → logout/login → buka hasil sebelumnya.

Assertion relevan:

- Diagnostic memenuhi 15 soal/kuota PK, PM, PU dan kunci tidak dikirim pada attempt aktif.
- Opsi invalid dan lintas origin ditolak; user lain tidak dapat membaca/submit attempt.
- Client tidak dapat memperpanjang timer, mengatur skor atau mengubah hasil selesai.
- Expiry menolak jawaban terlambat dan finalisasi tidak menggandakan mastery/riwayat.
- Sesi seluruhnya kosong tetap menghasilkan skor/riwayat, tetapi tidak menambah mastery.
- Module published dengan lesson kosong tidak ditampilkan sebagai tujuan.
- Hanya paket dengan seluruh referensi current/published yang runnable; ID logical tidak boleh ganda.
- Practice membuka keterampilan yang sesuai dengan lesson; mini memakai komposisi tetap 3 Medium + 2 Hard.
- Bila inventaris cukup, mini memakai soal belum terlihat; ketika stok terbatas, pengulangan dilabeli dan tidak menambah count bukti unik.
- Hasil/rekomendasi, count bukti dan riwayat tetap dapat dimuat setelah login ulang.
- Tidak ada overflow horizontal pada viewport uji dan tidak ada `katex-error` pada layar alur.
- QA menggunakan dua actor fixture berbeda; approval tidak otomatis menerbitkan draft.
- Suite tiga section selesai; timer katalog mengalahkan payload durasi client; ringkasan browser akun A tidak tampil pada akun B.

## Artefak bukti

- [Manifest versi/antrean](evidence/production-version-manifest.json)
- [Inventaris read-only produksi](evidence/production-readiness-2026-10-27.json)
- [Audit struktur](evidence/content-structure-2026-10-27.json)
- [Audit render aktual](evidence/content-render-2026-10-27.json)
- [Lesson desktop TEST_ONLY](evidence/test-only-1280-learning.png)
- [Lesson HP TEST_ONLY](evidence/test-only-390-learning.png)
- [Progress desktop TEST_ONLY](evidence/test-only-1280-progress.png)
- [Progress HP TEST_ONLY](evidence/test-only-390-progress.png)

Screenshot merupakan data sintetis dari alur lokal, bukan siswa atau hasil belajar nyata. Capture menunggu font dan animasi finite selesai sebelum memosisikan layar; ini mencegah scroll anchoring saat pengambilan bukti. Full-page screenshot tetap memotret elemen fixed pada posisi viewport.

## Produksi dan staging

Staging hosted: **belum diuji**. Tidak ada deployment baru dalam sesi ini.

Produksi terkonfirmasi: Supabase berubah dari INACTIVE ke ACTIVE_HEALTHY pada pemeriksaan ulang; SQL read-only berhasil; halaman publik 200; API learning anonim 401; API action anonim mengidentifikasi backend Supabase; redirect `/auth/google` menuju host proyek yang benar. Callback OAuth dan login akun terkontrol belum selesai.

Belum ada alur konten lengkap produksi: module PLSV mempunyai 1 Basic/3 Medium/1 Hard dan tidak terhubung ke practice dengan subtopic sama. Tidak ditemukan approval record untuk semua 140 referensi MT. Ini adalah dependensi reviewer/kurasi/acceptance, bukan alasan menurunkan assertion, mengubah kuota atau mengisi approval otomatis.

Remote CI dari baseline PR #17 masih gagal pada pemeriksaan awal. Lulus lokal dalam dokumen ini **tidak berarti remote CI branch baru sudah hijau**. Push, merge dan deploy belum dilakukan.
