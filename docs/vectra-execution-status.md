# VECTRA execution status

> Milestone: **Vectra — satu alur belajar terverifikasi dan siap uji coba**
>
> Pemeriksaan terakhir: **27 Oktober 2026 (Asia/Jakarta)**
>
> Dokumen ini adalah status operasional terkini. Dokumen historis lain di `docs/` tetap berguna sebagai catatan keputusan, tetapi klaim kondisi runtime harus dicocokkan ke dokumen ini dan bukti terbaru.

## Ringkasan status

| Area | Status 27 Okt 2026 | Bukti / dampak | Tindak lanjut |
| --- | --- | --- | --- |
| Repository | `main` = `2c20c6fef00e0bbc9d116046eacd0b9fc4445f5a` sebelum branch stabilisasi | GitHub branch `main` | Kerjakan stabilisasi pada `stabilize/vectra-pilot-readiness` |
| Production deployment | Vercel deployment commit tersebut berstatus `READY`; `www.levelup-academybna.fun` terpasang sebagai alias | Vercel deployment + aliases | Jangan menyamakan deployment READY dengan backend sehat |
| Backend VECTRA | **INACTIVE** | Supabase project `azrpaihfdtghcbdxkhqh` (`math-levelup`) melaporkan `INACTIVE`; query database gagal dengan database tidak dapat diakses | Pemilik perlu memulihkan project sebelum acceptance test produksi berbasis akun/database |
| Environment deployment | Variabel URL Supabase, anon key dan service-role key terdaftar di Vercel; nilai secret tidak dibaca dalam audit | Vercel project environment metadata | Setelah backend aktif, verifikasi koneksi dengan smoke test tanpa mengekspos secret |
| Auth SSR | Server client memakai `@supabase/ssr`; sebelum branch stabilisasi belum ada Next.js 16 `proxy.ts` untuk refresh session | Audit code + dokumentasi Supabase SSR terkini | Branch stabilisasi menambahkan refresh proxy tanpa mengubah authorization |
| MT-01 / MT-02 | **Historis, belum dapat diverifikasi ulang hari ini** | Verifikasi terakhir 18 Okt 2026: masing-masing suite 70 soal: PU 30, PK 20, PM 20; total 92m30s dengan timer per subtes | Re-query sesudah Supabase aktif; jangan membuat paket duplikat |
| 113 versi `IN_REVIEW` | **Historis, belum dapat diverifikasi ulang hari ini** | Disebut pada audit 18 Okt; database saat ini tidak dapat diquery | Setelah backend aktif, kelompokkan approved / published / rejected / waiting berdasarkan version ID |
| Learning / Practice availability | Runtime mempunyai API published-only, tetapi inventaris produksi tidak dapat dikonfirmasi saat backend inactive | `/api/learning`, `/api/practice-packages` membaca Supabase production | Rekomendasi di branch stabilisasi dibatasi ke learning path published yang benar-benar punya lesson |
| CI historis PR #16 | Gagal | Quality check berhenti di Prettier (44 file). Critical E2E: build sukses, 6/12 lulus; sebagian besar failure memakai copy/locator lama | Perbaiki locator sesuai intent VECTRA; jalankan ulang semua checks pada branch stabilisasi |

## Bukti yang terkonfirmasi vs historis

### Terkonfirmasi 27 Oktober 2026

- Repository utama adalah `Xpurple27/math-levelup`.
- `main` sebelum pekerjaan ini menunjuk commit `2c20c6f...`.
- Deployment production yang memakai commit tersebut berstatus `READY` di Vercel.
- Domain publik `www.levelup-academybna.fun` menunjuk deployment production tersebut.
- Project Supabase VECTRA yang benar adalah `azrpaihfdtghcbdxkhqh`, dan statusnya `INACTIVE`.
- Query database terhadap project tersebut gagal karena database tidak dapat diakses.
- Vercel mempunyai environment variable Supabase yang diperlukan; audit tidak membuka service-role secret.
- Project menggunakan Next.js 16 dan `@supabase/ssr`.
- Sebelum stabilisasi tidak ada Next.js `proxy.ts` / session refresh helper.
- Attempt, ownership check, scoring dan answer-key exposure berada di server pada implementasi yang diperiksa.
- Hasil attempt yang selesai dapat dibuka kembali dari Riwayat Belajar melalui ID attempt milik user.

### Historis dan belum dapat dikonfirmasi ulang

- MT-01 dan MT-02 berstatus published dengan 70 soal per suite pada 18 Oktober 2026.
- Terdapat 113 question versions `IN_REVIEW` pada laporan 18 Oktober 2026.
- Inventaris Practice dan Learning production yang pernah tersedia sebelum backend inactive.

Data historis di atas **tidak** diperlakukan sebagai status production terkini sampai database aktif kembali dan query ulang berhasil.

## Kontrak produk yang dipertahankan

Stabilisasi tidak boleh merusak kontrak berikut:

- jawaban benar dan penilaian tidak dikirim ke client selama attempt aktif;
- attempt hanya dapat dibaca/diubah oleh pemiliknya;
- deadline ditetapkan server dan tidak dapat diperpanjang oleh payload client;
- autosave/resume menggunakan attempt yang sama;
- finalisasi berulang bersifat idempotent;
- snapshot attempt selesai tetap menjadi histori immutable;
- question identity, question version dan taxonomy mapping tetap dipertahankan;
- publication tetap mengikuti workflow content/reviewer yang sudah ada;
- reviewer approval tidak boleh diisi atau dilewati oleh proses otomatis stabilisasi.

## Mastery dan confidence

VECTRA saat ini memakai indikator internal berbasis aturan, bukan model psikometrik terkalibrasi.

- `mastery.value` diperbarui dari evidence score berbobot kesulitan dan bobot jenis sesi.
- Bobot kesulitan evidence: Basic `1`, Medium `1.5`, Hard `2`.
- Bobot update sesi: diagnostic `0.30`, guided `0.10`, mini `0.35`, practice `0.20`, tryout `0.35`.
- `confidence` berasal dari jumlah **question ID unik** yang telah dijawab, dengan bobot Basic `0.5`, Medium `1`, Hard `1.5`, dibagi target bukti `20`, lalu dibatasi maksimum `1`.
- Confidence karena itu berarti **kecukupan/keragaman bukti internal**, bukan probabilitas siswa menguasai materi.
- Skor sesi 0–100 adalah persentase jawaban benar pada sesi tersebut, bukan prediksi skor resmi UTBK.

## Status tahap milestone

### Tahap 0 — kondisi awal

**Selesai secara dokumentasi.** Backend production inactive adalah blocker eksternal untuk verifikasi database terbaru.

### Tahap 1 — akses dan penyimpanan

**Dalam pengerjaan.** Branch stabilisasi menambahkan session refresh Next.js 16 dan memperbarui kontrak E2E. Acceptance test production tetap menunggu Supabase aktif.

### Tahap 2 — mutu MT-01 / MT-02

**Terblokir sebagian.** Standar QA PK/PM/PU telah dibaca kembali. Status version dan isi produksi tidak dapat diaudit ulang selama database inactive. Tidak ada approval/publish otomatis yang dilakukan.

### Tahap 3 — satu alur belajar lengkap

**Dalam pengerjaan.** Rekomendasi diarahkan hanya ke published learning module yang mempunyai published lesson, Learn membuka subtopic yang direkomendasikan, dan akhir lesson dapat diteruskan ke Practice terdekat.

### Tahap 4 — uji coba siswa

Dokumen protokol pilot disiapkan pada branch stabilisasi. Status tidak boleh dinaikkan menjadi “pilot completed” sampai data siswa nyata tersedia.

### Tahap 5 — portfolio dan premium blueprint

Dokumen case study, demo script, dan premium blueprint disiapkan pada branch stabilisasi. Klaim penggunaan nyata harus tetap kosong sampai ada data nyata.

## Blocker yang membutuhkan tindakan pemilik

### Mengaktifkan kembali Supabase production

Acceptance test production untuk login, Google OAuth, attempt, learning, practice, tryout, status version dan reviewer workflow membutuhkan project `azrpaihfdtghcbdxkhqh` aktif kembali.

Stabilisasi **tidak** akan:

- memindahkan VECTRA ke project Supabase lain;
- menghapus/reset database;
- membuat ulang schema untuk mengatasi inactivity;
- mengeksekusi restore yang berpotensi memunculkan biaya tanpa otorisasi pemilik.

Setelah project aktif, jalankan ulang checklist production pada bagian akhir dokumen ini.

## Checklist acceptance setelah backend aktif

1. Login email pada browser bersih dan browser yang memiliki session lama.
2. Login Google dan callback kembali ke domain production.
3. Logout lalu login ulang; session lama tidak menyebabkan redirect loop.
4. User A tidak dapat membaca/submit attempt milik User B.
5. Mulai diagnostic, jawab beberapa soal, reload, dan pastikan jawaban tersimpan.
6. Logout/login ulang dan resume attempt aktif.
7. Submit, reload hasil, lalu buka kembali attempt dari Riwayat Belajar.
8. Coba submit kedua kali; hasil tidak berubah.
9. Verifikasi attempt expired menolak jawaban terlambat dan finalizes sekali.
10. Query ulang inventory `question_versions`, MT-01/02, practice package, learning module/lesson dan reviewer state.
11. Jalankan satu flow: Diagnostic → Direction → Learn → Practice → Assessment → Progress pada desktop dan HP.
12. Catat hasil sebagai production evidence; jangan memakai hasil local/staging sebagai bukti production.
