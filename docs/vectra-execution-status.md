# VECTRA execution status

Milestone: **Vectra — satu alur belajar terverifikasi dan siap uji coba.**

Pemeriksaan: **27 Oktober 2026, Asia/Jakarta**. Status akhir: **alur lokal terverifikasi; pilot produksi belum boleh dimulai**. Perangkat uji coba siap, tetapi konten terhubung, persetujuan reviewer, dan acceptance akun produksi belum lengkap.

## Baseline dan lingkungan

| Temuan             | Bukti terbaru / sumber                                                                                                  | Dampak dan tindak lanjut                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `main` / produksi  | `2c20c6fef00e0bbc9d116046eacd0b9fc4445f5a`; Vercel `dpl_93nrToJhf6WLYD3Pq6RWdUi2AjrV`, `READY`                          | Domain `www.levelup-academybna.fun` masih memakai baseline ini; patch sesi ini belum diterapkan                                          |
| PR #17             | Branch `stabilize/vectra-pilot-readiness`, baseline `f0a09ea26fe9212ba16040756ddfb7d5605d9085`                          | Pekerjaan sebelumnya dipertahankan sebagai dasar patch                                                                                   |
| CI baseline PR #17 | Runs `40465189249` dan `40465189250`, keduanya gagal                                                                    | 48 file format; 8 error lint; tipe `cookiesToSet`; satu fixture Postgres `invalid package`; E2E tidak sempat berjalan karena build gagal |
| Checkout           | Checkout yang tersedia mula-mula bersih pada `main`, kemudian teramati perubahan dari sesi lain                         | Salinan lokal terisolasi memakai branch `fix/vectra-verified-learning-loop`; tidak menimpa perubahan aktif sesi lain                     |
| Supabase           | `azrpaihfdtghcbdxkhqh`: awal sesi `INACTIVE`, SQL gagal; pemeriksaan ulang `ACTIVE_HEALTHY`, SQL berhasil               | Pemulihan tidak dilakukan oleh sesi ini. Penyebab inactivity belum dibuktikan; jangan menganggap otomatis karena inactivity tujuh hari   |
| Koneksi produksi   | HTTP `/auth/google` memberi 307 ke host `azrpaihfdtghcbdxkhqh.supabase.co`; `/api/action` 200 dengan backend `supabase` | Proyek yang dipakai domain terkonfirmasi tanpa membaca service-role key; callback/login OAuth belum diuji sampai selesai                 |
| Akses publik       | `/` 200; `/api/learning` anonim 401                                                                                     | Halaman publik dan penolakan akses anonim terkonfirmasi; belum merupakan acceptance akun siswa                                           |
| Environment        | Metadata Vercel mencatat URL Supabase, anon key, service-role key dan site URL pada production/preview                  | Nilai secret tidak dibaca atau disimpan; endpoint OAuth dipakai untuk membuktikan target URL                                             |

Sumber: Git lokal, GitHub Actions API, Vercel deployment/env metadata, Supabase project/SQL/advisors, HTTP domain publik. Seluruh pembacaan produksi sesi ini bersifat read-only. Tidak ada akun, role, konten, approval, schema atau data siswa produksi yang diubah.

## Inventaris produksi terkonfirmasi

| Objek             | Keadaan pada pemeriksaan                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Logical questions | 421 seluruh status; 245 current ACTIVE dengan versi PUBLISHED sebelum penyaringan taxonomy                                   |
| Question versions | 663 PUBLISHED, 113 IN_REVIEW, 1 QA_PASSED. Versi terbit mencakup versi historis; bukan 663 soal siswa unik                   |
| Antrean revisi    | 40 PK, 40 PM, 33 PU. Daftar version ID ada dalam manifest bukti; tidak dibuat ulang                                          |
| MT-01 dan MT-02   | Masing-masing PU 30 / 1.800 detik, PK 20 / 1.200 detik, PM 20 / 2.550 detik: 70 soal, total 5.550 detik = 92m30s             |
| Referensi MT      | Seluruh 140 referensi cocok dengan current PUBLISHED ACTIVE pada saat query                                                  |
| Practice          | 24 paket FREE PUBLISHED, masing-masing 10 referensi current; 18 paket FREE ARCHIVED                                          |
| Learn             | 2 module PUBLISHED, 6 lesson PUBLISHED                                                                                       |
| Review records    | 1 approval QUESTION_VERSION; tidak ada approval module/lesson. Semua 140 versi MT tidak mempunyai approval record yang cocok |

Status terbit **bukan bukti persetujuan matematis/editorial**. Asal ketidaklengkapan audit review belum diketahui. Trigger `immutable_version` dan `publication_guard` teramati enabled; pemeriksaan ini tidak menyimpulkan bagaimana konten historis diterbitkan.

Referensi: [manifest versi](evidence/production-version-manifest.json), [laporan review](content-review-status.md), [SQL verifikasi ulang](../supabase/verify-vectra-readiness.sql).

## Satu keterampilan yang paling siap

Kandidat: **Persamaan Linear Satu Variabel**, module `LM-PK-LIN-01`, subtopic `14000000-0000-4000-8000-000000000002`.

- Tiga lesson, 19 blok; lima soal current published: 1 Basic, 3 Medium, 1 Hard (`PK-LIN-001`–`005`). Kelima kunci dihitung ulang dalam sampel review; approval independen tetap belum tersedia.
- Mini yang ada mensyaratkan **3 Medium + 2 Hard**, sehingga kurang satu Hard.
- Tidak satu pun dari 24 practice terbit memuat subtopic ini. Paket aljabar memakai taxonomy V2 yang berbeda. Kesamaan nama domain tidak membuktikan kesesuaian subtopic.
- Module Persentase (`LM-PERCENT-01`) memiliki tiga lesson/22 blok, tetapi nol current published pada subtopic lamanya.
- Karena itu **belum ada rekomendasi produksi yang memenuhi alur lengkap**. Patch menampilkan keadaan ini secara jujur, tanpa menyembunyikan riwayat siswa atau mengubah kuota agar lolos.
- [Rencana kurasi](linear-pilot-curation.md) mencatat referensi yang harus dihubungkan, kandidat tambahan DRAFT dan batasan pengulangan. Tidak ada versi baru diimpor atau diterbitkan.

## Perubahan patch

- Memperbaiki tipe dan cache response cookie refresh proxy; authorization tetap di route/server.
- Memperbaiki sinkronisasi editor, pemuatan data React dan ringkasan browser tanpa mematikan aturan lint.
- Memvalidasi seluruh referensi versi paket; paket kosong, parsial, versi lama atau duplicate logical ID tidak ditawarkan sebagai runnable.
- Menyeleksi rekomendasi hanya untuk alur materi → FREE practice → mini yang benar-benar tersedia, dengan alasan berbasis nilai mastery dan jumlah bukti.
- Materi meneruskan subtopic yang sedang dibaca; Practice memakai cakupan soal aktual. Hasil practice menawarkan mini pada keterampilan yang tersedia.
- Menampilkan bukti unik per keterampilan, penjelasan rumus dan jumlah soal asesmen ulang yang pernah muncul.
- Sesi tanpa jawaban tidak memperbarui mastery. Skor sesi tetap menghitung jawaban kosong.
- Menjaga argumen fungsi seperti `$f(1)+f(2)$` agar tidak rusak oleh pemformatan nomor pernyataan.
- Menyamakan timer adapter lokal dengan durasi katalog yang dimuat server; nilai client tidak dipercaya.
- Ringkasan suite di browser memakai namespace akun; hasil attempt server tetap otoritatif.
- Memperbaiki fixture/locator sambil mempertahankan assertion keamanan, expiry, resume dan finalisasi; memperluas pemicu E2E serta audit repository di CI.

## Rumus yang benar-benar diimplementasikan

Untuk setiap keterampilan, bukti sesi adalah persentase kredit benar dengan bobot kesulitan Basic 1, Medium 1,5, Hard 2. Kredit guided pada percobaan kedua yang benar = 0,5; lainnya 1. Jawaban salah/kosong mendapat 0; penyebut mencakup semua soal keterampilan pada sesi itu. Batas bukti: 60 bila hanya Basic; 80 bila tingkat tertinggi Medium; 100 bila ada Hard.

Mastery pertama = bukti sesi. Selanjutnya `round((1−α) × mastery_lama + α × bukti_sesi)`, dengan `α = bobot_jenis_sesi × min(1, jumlah_soal_keterampilan/5)`. Bobot: diagnostic 0,30; guided 0,10; practice 0,20; mini/tryout 0,35. Sesi yang seluruh jawaban keterampilannya kosong tidak memberikan update baru.

Confidence = `min(1, jumlah_bobot_ID_soal_unik_terjawab/20)`. Bobot Basic 0,5; Medium 1; Hard 1,5. Untuk ID yang sama lintas sesi/versi, bobot kesulitan tertinggi yang pernah dijawab dipertahankan. Mengulang ID tidak menambah jumlah bukti unik, tetapi masih dapat mengubah mastery. Confidence merupakan kecukupan bukti internal, **bukan probabilitas statistik**. Skor benar/total 0–100 bukan prediksi skor resmi UTBK. Label kesulitan belum terkalibrasi empiris.

Peta domain merangkum keterampilan yang sudah mempunyai jawaban; belum adanya jawaban dibedakan dari skor nol. Jumlah jawaban terkirim di dashboard mencakup pengulangan dalam maksimum 30 sesi riwayat. Pembacaan lesson belum disimpan sebagai completion event server; pilot mencatatnya melalui observasi.

## Hasil pengujian dan batas bukti

Hasil final dicatat pada [validation](validation-current.md). Pengujian desktop 1280px dan HP 390px memakai build produksi **lokal** dengan SQLite + PostgreSQL/PGlite dan fixture TEST_ONLY terisolasi. Nama env `LEVELUP_E2E_PRODUCTION=1` berarti menjalankan `next start`, bukan mengakses database produksi.

Alur browser yang diuji: daftar → diagnostik → autosave/reload → logout/login → resume attempt/deadline yang sama → hasil → rekomendasi beralasan → lesson → practice → mini dengan soal baru tersedia → hasil → progress → logout/login → buka hasil lama. Batas akses user lain, kunci server, submit ulang, expiry dan reporter tetap diuji.

Audit renderer atas 140 versi MT memproses 2.037 field nonkosong; 267 field menghasilkan KaTeX; nol `katex-error`. Audit struktural dan render tidak membuktikan ketepatan matematika semua 140 butir. Review matematis/editorial seluruh paket serta approval independen belum selesai.

| Tahap                  | Status                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| 0 — kondisi awal       | Selesai, termasuk perubahan backend inactive → healthy dan inventaris terbaru                       |
| 1 — akses/attempt      | Terverifikasi lokal; HTTP publik produksi terverifikasi terbatas; akun produksi/OAuth belum selesai |
| 2 — mutu dua paket     | Struktur, versi dan rendering diaudit; 113 revisi menunggu; approval independen belum lengkap       |
| 3 — alur utuh          | Lulus lokal desktop/HP; produksi tertahan cakupan konten, reviewer dan acceptance akun              |
| 4 — uji coba           | Protokol dan formulir kosong siap; belum ada peserta nyata atau hasil                               |
| 5 — portofolio/premium | Studi kasus, demo dan blueprint tersedia dengan klaim dibatasi bukti                                |

## Prioritas berikutnya

1. Reviewer independen memeriksa 113 revisi yang sudah ada serta lima soal/lesson calon alur PLSV. Lengkapi bukti review tanpa mengisi atas nama orang lain.
2. Kurasi practice yang memakai subtopic sama dan lengkapi kuota mini; utamakan butir setara tetapi berbeda. Selesaikan review, lalu admin menerbitkan melalui workflow yang menjaga current pointer/referensi paket dan snapshot lama.
3. Review patch, lalu push/PR, merge dan deploy hanya setelah diotorisasi sesuai `AGENTS.md`. Patch sesi ini belum dipush, dimerge atau dideploy.
4. Dengan akun uji produksi yang terkontrol, jalankan login/email/OAuth, ownership, reload/logout/resume, timer, submit ulang dan pembukaan hasil. Jangan memakai data siswa nyata sebagai fixture.
5. Setelah gate di atas lulus, jalankan protokol 10–20 siswa; isi laporan anonim dari data nyata. Hingga saat itu statusnya **perangkat uji coba siap; pilot produksi menunggu gate**.
