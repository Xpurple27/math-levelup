# Laporan stabilisasi MVP — 7 Oktober 2026

Tahap ini hanya menstabilkan baseline. Tidak ada payment, leaderboard, AI, achievement, adaptive engine, CMS, atau penambahan soal. Bank tetap 252 soal; paket PK/PM/PU tetap Paket 01 dan 02, 20 soal / 20 menit. Diagnostik tetap 15 soal / 30 menit.

## 1. File dan boundary yang dirapikan

- `src/components/levelup.tsx`: dari 1.717 menjadi sekitar 517 baris, berisi state, sesi, sinkronisasi timer, navigasi, dan shell. JSX per domain dipindahkan ke `src/components/levelup/{dashboard,learn,practice,tryout,progress,exam,result,auth,submit}-view.tsx`. `types.ts`, `labels.ts`, dan `view-ui.tsx` menampung tipe publik, label, dan dua komponen tampilan kecil. Tidak ada state manager/framework baru.
- `src/app/api/action/route.ts`: dari 301 menjadi 59 baris. URL dan format respons tetap. Validasi Origin, identitas, dan dispatch tetap di route; auth di `src/features/auth/actions.ts`, assessment di `src/features/assessment/actions.ts`, feedback/retry practice di `src/features/practice/answer.ts`, progress di `src/features/progress/read.ts`. Tidak ada endpoint tambahan.
- `src/lib/store-types.ts` memisahkan tipe penyimpanan dari implementasi SQLite. `store-errors.ts` memisahkan error dari Supabase. `learning-rules.ts` menyatukan durasi lokal, kualifikasi aktivitas, tanggal Jakarta, dan streak.

## 2. Perilaku yang dipertahankan

Auth cookie/konfirmasi email, pemeriksaan Origin dan pemilik attempt, soal tetap per paket, snapshot beku, timer dari server, autosave/resume, penolakan jawaban terlambat, penilaian server, petunjuk hanya di guided, satu retry guided, penguncian jawaban practice, pembahasan setelah assessment selesai, submit idempotent, update nilai mastery, dan streak. Tidak ada perubahan tata letak/CSS. Label bukti pada Progress kini menyebut **soal unik terjawab** agar sesuai dengan metrik yang diperbaiki.

## 3. CI yang lebih hemat

`.github/workflows/ci.yml` menjalankan install dengan cache npm, format, lint, typecheck, unit, dan build. Install Chromium dan Playwright dipindahkan ke `.github/workflows/e2e.yml`, yang hanya dipicu PR pada API/auth, library/trust boundary, exam/auth/submit/result/practice/tryout UI, shell sesi, QA content, persistence/migration, dependensi, atau konfigurasi E2E/Next; juga bisa dijalankan manual lewat Actions.

Perubahan tampilan Learn/Dashboard, CSS, atau tooling biasa tidak otomatis memasang browser. Jika perubahan dalam file presentasi mengubah perilaku assessment, jalankan workflow E2E manual. Filter sengaja konservatif untuk trust boundary. PR kritis menjalankan kedua workflow; build/install masih dilakukan di masing-masing job agar workflow tetap sederhana. Penghematan runner aktual belum diukur di GitHub; tidak ada klaim bahwa workflow sudah dijalankan secara remote.

## 4. Parity SQLite–Supabase

Ditemukan dan diperbaiki:

- Pembuatan attempt lokal sebelumnya tidak memeriksa existing active attempt di dalam transaksi. Kini `BEGIN IMMEDIATE` mencakup lookup dan insert, sehingga dua start tidak menciptakan sesi aktif baru untuk scope yang sama. Postgres mempertahankan advisory lock dan unique index-nya.
- SQLite sebelumnya tidak memiliki revision/CAS untuk autosave dan tidak memeriksa deadline di UPDATE. Kolom revision ditambahkan secara aman pada database lama; save hanya berhasil untuk pemilik, status aktif, revision yang sama, dan waktu yang belum habis. Konflik menghasilkan 409 seperti adapter Supabase.
- Finalisasi SQLite sebelumnya belum memeriksa revision dan prior mastery. Kini keduanya diperiksa dalam transaksi yang sama dengan result/mastery/activity; konflik tidak menimpa progres. Submit ulang tidak menulis ulang result atau evidence. Supabase mempertahankan RPC yang sama dan mengembalikan hasil boolean no-op.
- ID attempt yang formatnya bukan UUID ditolak sebelum lookup pada kedua adapter, sehingga request malformed tidak menjadi error storage Postgres sementara SQLite mengembalikan not-found.
- Pembacaan mastery lokal diurutkan berdasarkan topic seperti Supabase, sehingga urutan ketika rekomendasi memiliki nilai yang sama konsisten.
- Streak dan tanggal menggunakan helper Jakarta yang sama. Perbedaan timer hanya sumber clock: Node untuk SQLite dan database clock untuk Postgres. Tes memastikan durasi seluruh paket sama dengan katalog; SQL tetap otoritas deadline production.

SQLite tidak dihapus dan tidak pernah dipilih pada Vercel. Tes parity memakai database sementara SQLite dan PostgreSQL lokal via PGlite, bukan akses Supabase hosted. Tidak ada penghapusan attempt lama untuk memperbaiki data legacy; duplikasi sesi aktif dari database SQLite lama, jika sudah ada sebelum perubahan, perlu diperiksa terpisah.

## 5. Mastery confidence

Nilai mastery tetap memakai correctness berbobot 1 / 1,5 / 2, cap difficulty, bobot sumber, dan smoothing yang sama. Confidence kini memakai `uniqueEvidence`, sebuah map ID soal → difficulty di JSON mastery yang sudah ada.

- Hanya soal yang mempunyai jawaban tersimpan dihitung; benar maupun salah tetap merupakan observasi.
- ID yang sama hanya dihitung satu kali, termasuk bila version-nya berubah. Jika rating difficulty berbeda dalam evidence historis, satu ID mempertahankan difficulty tertinggi yang pernah dijawab.
- `count` = jumlah ID unik terjawab. `advanced` = jumlah ID unik Medium/Hard.
- Confidence = `min(1, (0,5 × Basic unik + 1 × Medium unik + 1,5 × Hard unik) / 20)`.
- Label Mastered tetap memerlukan nilai ≥80, confidence ≥0,7, serta ≥8 evidence Medium/Hard unik.
- Pengulangan masih bisa memengaruhi nilai mastery melalui formula sesi existing, tetapi tidak menambah count/confidence untuk ID yang sama. Dictionary evidence tetap di server dan tidak disertakan dalam respons progress publik.

Ini heuristic deterministik, bukan IRT, kalibrasi UTBK, atau klaim confidence statistik. Variasi parameter dari keluarga yang sama masih berkorelasi dan dihitung sebagai ID berbeda; QA mengidentifikasi keluarga/varian agar korelasi tersebut terlihat.

SQLite menghitung ulang metadata legacy saat startup dari seluruh snapshot **completed** dan jawaban tersimpan. Supabase perlu menjalankan `supabase/migrations/202610070001_unique_mastery_evidence.sql` setelah migrasi sebelumnya. Migrasi replayable dan hanya menyentuh metadata confidence/count/advanced; **nilai mastery, jawaban, snapshot, skor/result, dan tanggal aktivitas lama tidak diubah**. Koordinasikan deployment/migrasi dalam waktu tanpa aktivitas tes: aktifkan versi baru dan selesaikan request versi lama, lalu jalankan SQL. Hindari deployment preview lama yang masih menulis formula metadata lama. Migrasi mengunci penulisan terkait selama backfill; akun lama bisa menampilkan pesan upgrade sampai SQL selesai. Jangan melewati migrasi untuk akun yang sudah mempunyai mastery lama; adapter online menolak melanjutkan aggregate tanpa metadata unik agar tidak salah menghitung history.

## 6. QA bank soal

`content/question-qa.json` mempunyai satu record per 252 ID, status VALID / NEEDS_REVIEW / REJECTED, fingerprint konten, family, dan variant. Review VALID harus menyebut reviewer, tanggal, serta seluruh sembilan pemeriksaan manusia. Perubahan konten membatalkan approval melalui fingerprint. Tidak ada auto-approval generated content.

`npm run content:qa` memeriksa struktur, kelengkapan registry/taxonomy, approval, dan mengeluarkan `.reports/content-qa.json` tanpa kunci/pembahasan. Hasil awal: **0 VALID, 252 NEEDS_REVIEW, 0 REJECTED**, 0 kelompok duplikat teks persis, dan **56 kelompok kemiripan** setelah angka dinormalisasi. Sebagian adalah variasi keluarga yang disengaja; laporan tidak otomatis memvonis soal salah atau duplicate tidak layak. Pemeriksaan aggregate distraktor menemukan jawaban benar merupakan opsi minimum pada 171 dari 252 soal dan tidak pernah opsi maksimum. Pada seluruh 144 soal tambahan, jawaban benar selalu opsi angka terkecil. Ini merupakan cue yang perlu diperbaiki lewat review/revisi konten, bukan bukti kompetensi siswa; versi/paket existing tidak diubah pada refactor ini.

REJECTED dikeluarkan dari pemilihan baru; paket tetap yang berisi soal rejected tidak dimulai dengan set yang diam-diam berbeda. Snapshot attempt lama tidak diubah. Pending masih tersedia untuk beta existing. Infrastruktur QA tidak berarti seluruh soal sudah diperiksa matematika/manusia. Lihat `docs/content-bank.md` untuk cara review.

## 7. Keamanan dan risiko yang tersisa

`npm run audit:repository` memeriksa file kerja yang dapat dicommit dan blob history reachable di checkout, dengan pola token privat, JWT service-role, URL database berpassword, private-key, assignment secret, data SQLite, dan kandidat email pribadi. Laporan tidak mencetak nilai credential. Pemindaian awal pada 118 blob historis dan working tree tidak menemukan temuan; scan ini bukan jaminan menyeluruh atas semua bentuk secret, binary asset, data pribadi, atau log/artifact di luar checkout.

Repository disebut public oleh pengguna. Pemeriksaan visibility lewat GitHub API diblokir akses jaringan; visibility tidak diubah. **Direkomendasikan private** karena source bank memuat kunci dan pembahasan, meskipun bundle/browser tidak mendapat kunci selama ujian aktif. Tidak ada key, database siswa, atau real student data baru yang dimasukkan ke Git.

Risiko tersisa: semua soal belum human-approved; variasi keluarga masih dapat memberi evidence yang berkorelasi; tidak ada estimasi UTBK terkalibrasi; rate limiting auth masih in-process; password recovery belum tersedia; konflik multi-tab membutuhkan reload; histori UI hanya 30 sesi; expiry dilakukan pada akses berikutnya jika browser ditutup; hosted Supabase/Vercel belum diverifikasi dari cloud ini. Snapshot dengan konten kemudian rejected tetap tersedia sebagai riwayat historis.

## 8. Verifikasi

Dilakukan lokal: format check, lint, typecheck, unit, build production, Playwright critical, `content:qa`, dan `audit:repository`. Suite mencakup alur belajar/paket existing, owner/redaction/scoring, deadline/late answer, frozen resume/result, konsistensi fixed question set, revision race, CAS mastery, streak, metadata unique evidence/migration replay, penolakan soal QA, dan penanganan konflik RPC oleh adapter Supabase. Pengulangan satu paket melalui API/browser diuji agar confidence tidak meningkat dan metadata internal tidak bocor.

Hasil final: format, lint, typecheck dan production build lulus; 57 tes unit/database lulus dan 10 tes Playwright production lulus. `content:qa` dan `audit:repository` juga lulus sebagai pemeriksaan tooling (status konten tetap pending, bukan human-approved). Tidak ada klaim deployment Vercel, SQL hosted, SMTP/email confirmation, atau workflow Actions remote telah diuji langsung.

## 9. Rekomendasi user testing

Baseline teknis ini layak untuk **uji internal terkontrol**. Uji siswa terbatas sebaiknya dimulai setelah migrasi Supabase diterapkan, auth/persistensi deployment diverifikasi dengan akun tes, dan soal dalam paket/modul pilot selesai review manusia, termasuk perbaikan cue distraktor yang membuat jawaban bisa ditebak tanpa menghitung. Gunakan kelompok kecil yang mengetahui ini beta dan hasilnya bukan prediksi UTBK. Jadikan repository private sebelum membuka akses siswa yang membutuhkan integritas hasil. Jangan menambah fitur produk sampai temuan pilot tersebut ditangani.
