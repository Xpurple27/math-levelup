# MT-01 / MT-02 — review status, 27 Oktober 2026

Status: **versi dan rendering terverifikasi; persetujuan independen serta review matematis/editorial penuh belum selesai**. Tidak ada approval, publish, reject, archive atau revision baru dibuat dalam database oleh sesi ini.

## Inventaris yang benar-benar tampil

Database produksi `azrpaihfdtghcbdxkhqh` sudah `ACTIVE_HEALTHY` pada pemeriksaan ulang. Enam bagian MT berstatus FREE/PUBLISHED: per suite PU 30 soal/30 menit, PK 20/20 menit, PM 20/42,5 menit. Kedua suite menggunakan 140 referensi current ACTIVE/PUBLISHED. [Manifest](evidence/production-version-manifest.json) mencatat code, version ID, nomor versi, status dan paket; kunci tidak disertakan.

Terdapat 113 revisi IN_REVIEW: PK 40, PM 40, PU 33. Semuanya masih menunggu; tidak satu pun direferensikan langsung oleh tryout. Jumlah ini sama dengan laporan historis, tetapi kesamaan count saja tidak membuktikan identitas setiap anggota antrean historis tanpa snapshot 18 Oktober. Manifest mencatat anggota antrean yang terkonfirmasi hari ini.

Seluruh 140 versi MT mempunyai **nol approval record yang cocok** dalam `content_reviews`. Seluruh 245 current ACTIVE/PUBLISHED juga belum mempunyai record tersebut. Hanya ada satu approval QUESTION_VERSION dalam tabel, terkait butir QA_PASSED yang belum terbit. Tidak ada review module/lesson. Ini adalah **kesenjangan bukti review**, bukan bukti bahwa setiap kunci salah atau penjelasan tentang bagaimana penerbitan historis terjadi. Trigger publikasi/immutability tetap enabled pada pemeriksaan.

| Kategori                                | Keadaan terkonfirmasi                                                  |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Current MT                              | 140 referensi PUBLISHED/current, belum terbukti approval independennya |
| Revisi menunggu                         | 113 IN_REVIEW, belum terbit                                            |
| QA_PASSED                               | 1 di luar paket, perlu pemeriksaan ulang; bukan konten siswa           |
| Revisi disetujui/ditolak dalam sesi ini | 0; tidak ada keputusan reviewer diisi oleh otomatisasi                 |

## Pemeriksaan otomatis

[Audit struktur](evidence/content-structure-2026-10-27.json) memeriksa semua 140 versi MT: 4–5 opsi, satu key, teks opsi duplikat, ekuivalensi angka sederhana, field wajib, konsistensi huruf jawaban akhir dan flag analisis opsi. Tidak ditemukan kegagalan count/key/field wajib/huruf jawaban akhir pada pemeriksaan terbatas itu; dua butir memunculkan flag analisis huruf untuk review manual.

Batas: pemeriksa ekuivalensi angka tidak membuktikan ekuivalensi aljabar; label kesulitan, kejelasan stimulus, orisinalitas dan ketepatan semua inferensi tetap memerlukan review. Semua field MT masih menggunakan matematika teks biasa pada export, sehingga hitungan fragmen LaTeX mentah adalah nol; ini bukan bukti tidak ada matematika yang dirender.

[Audit renderer](evidence/content-render-2026-10-27.json) memakai komponen Markdown/KaTeX aplikasi yang sebenarnya: 2.037 field, 267 field menghasilkan KaTeX, nol error KaTeX. Tidak ada stimulus tabel Markdown atau gambar dalam subset MT yang diekspor ini; keterbacaan gambar/tabel produksi belum dibuktikan. Uji HP alur memakai konten sintetis, sehingga tidak boleh disebut review HP atas seluruh 140 soal.

## Sampel editorial yang dihitung/diperiksa ulang

| Butir / versi siswa                   | Temuan                                                                                                                             | Revisi yang sudah tersedia                                                                           | Tindakan                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| V2-PM-CH-001 v2                       | Model benar B. Opsi C dan E ekuivalen (`3.000+8.000x` dan `8.000x+3.000`); analisis menyebut B sebagai kesalahan menukar koefisien | v3 `059b80f9-14bc-4951-b2c8-eaa25b22d318`, IN_REVIEW: penjelasan B dan pengecoh E diperbaiki         | Reviewer periksa opsi revisi penuh; gunakan revisi ini, jangan duplikasi                                                                    |
| V2-PU-DED-001 v2                      | Rantai inklusi menghasilkan B; analisis justru menyebut B membalik hubungan                                                        | v3 `69259dea-3a51-4a54-82fe-f7066ef6c9d9`, IN_REVIEW                                                 | Review dan persetujuan independen                                                                                                           |
| V2-PU-DED-003 v2                      | Rina anggota Merah ⇒ tidak ikut kelas malam (E); analisis menuduh E menambah informasi                                             | v3 `b43332a2-7a77-4bb2-acb7-4914f23510c3`, IN_REVIEW                                                 | Review dan persetujuan independen                                                                                                           |
| V2-PU-Q-008 v2                        | Masing-masing pernyataan tidak cukup, gabungan cukup; A benar. Analisis menyebut A mengabaikan nilai negatif                       | v3 `ff617801-e651-47e1-85a9-4c183e83e4b6`, IN_REVIEW, memakai contoh n=±11 dan n=5/11                | Review dan persetujuan independen                                                                                                           |
| PK-LIN-001–005 v1, di luar MT         | Hasil ulang masing-masing x=6; a=4; x=4; p=5/2; a=0. Pada 005, a=2/4 tidak memberi solusi persamaan terkait                        | Belum ada tambahan/revisi diimpor                                                                    | Lima kunci sampel konsisten; kesulitan dan analisis pengecoh masih provisional                                                              |
| Q-7E5E8A3AD6504657B29E9D5C0F7A954D v1 | Dua persamaan memberi y=3, tetapi key B/4; pembahasan tidak memadai dan taxonomy PLSV tidak cocok dengan SPLDV                     | **QA_PASSED, belum PUBLISHED**, tidak di MT/practice; satu approval record bukan jaminan kunci benar | Kembalikan melalui workflow yang berlaku untuk koreksi key A/3, solusi eliminasi dan taxonomy. Jangan terbitkan. Tidak diubah oleh sesi ini |

Validasi independen untuk butir terakhir: kurangi `2x+4y=32` dengan `2x+3y=29`, diperoleh y=3. Substitusi menghasilkan x=10 dan memenuhi kedua persamaan. Tidak ada persetujuan manusia yang ditambahkan oleh audit ini.

## Standar reviewer

Gunakan writer skill dan blueprint PK, PM, PU yang disediakan proyek. Periksa matematika melalui dua lintasan bila relevan; asumsi; satu key; ekuivalensi semua pengecoh; huruf opsi setelah reorder; kejelasan bahasa; taxonomy dan konstruk; alasan kesulitan; solusi serta diagnosis pengecoh; orisinalitas. Distribusi kesulitan adalah label editorial sementara, bukan parameter IRT.

Catatan sumber: pada contoh induktif blueprint PU yang dilampirkan, contoh perpustakaan menuliskan key D sementara penalarannya mendukung C; contoh pola menuliskan C sementara perhitungannya memberi 30/D. Jangan menyalin key contoh tanpa menghitung ulang. File sumber pengguna tidak diubah. Referensi mode tambahan yang disebut skill tidak seluruhnya dilampirkan; gunakan blueprint yang tersedia dan minta standar lengkap sebelum produksi PU baru yang bergantung padanya.

## Penerbitan berikutnya

1. Reviewer sah dan independen memeriksa versi yang sudah ada; pisahkan persetujuan matematis dan editorial yang disyaratkan workflow. Identitas reviewer harus berbeda dari creator/editor.
2. Setelah diotorisasi, admin menggunakan workflow penerbitan, bukan mengubah status langsung melalui SQL.
3. Periksa current pointer dan referensi versi tryout/practice/lesson secara atomik; renderer runtime menolak paket yang menjadi parsial karena referensi usang.
4. Simpan snapshot attempt lama; jangan menjalankan reset/rebuild database untuk memperbaiki status.
5. Jalankan ulang verifier, audit/render dan acceptance desktop/HP pada versi siswa yang benar-benar baru.
