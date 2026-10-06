# Bank soal — ekspansi pertama

Bank saat ini berisi **252 soal pada 7 subtopik**. Semua soal merupakan contoh original/variasi parameter, bukan arsip soal resmi UTBK. Pembagian tingkat kesulitan awal perlu ditinjau editor sebelum penggunaan luas.

| Subtopik                      | Bagian | Soal |
| ----------------------------- | ------ | ---- |
| Rasio & perbandingan          | PK     | 36   |
| Persamaan linear              | PM     | 36   |
| Rata-rata & interpretasi data | PU     | 36   |
| Persentase & perubahan        | PK     | 36   |
| Luas, keliling & volume       | PK     | 36   |
| Peluang & aturan pencacahan   | PM     | 36   |
| Pola bilangan & barisan       | PU     | 36   |

Setiap subtopik memiliki 12 Basic, 12 Medium, dan 12 Hard. Empat subtopik baru menambah 48 keluarga soal, masing-masing tiga variasi parameter. Pembahasan menyertakan langkah pertama, penyelesaian, petunjuk, dan kesalahan umum. Modul konsep tersedia untuk semua tujuh subtopik.

## Pemilihan soal

- Diagnostik baru: 15 soal, tepat 5 PK + 5 PM + 5 PU; semua tujuh subtopik mendapat sampel. Sampel per subtopik kecil, sehingga hasil tetap profil awal ber-confidence rendah.
- Terbimbing: 2 Basic + 2 Medium + 2 Hard.
- Mini assessment: 3 Medium + 2 Hard.
- Latihan campuran: 5/10/15/20 soal dan mencakup setiap tingkat kesulitan.
- Latihan satu tingkat: 5 atau 10 soal; bank per tingkat memiliki 12 soal.
- Server memprioritaskan ID soal yang belum muncul dalam 30 sesi terakhir pengguna. Setelah habis, soal lama dapat dipilih untuk review. Variasi dari keluarga yang sama belum dikelompokkan dalam pemilihan; confidence mastery masih menghitung pengulangan, sehingga tidak dianggap bukti kalibrasi.
- Sesi aktif dilanjutkan dengan snapshot yang sama meskipun siswa mengubah filter sebelum menekan mulai lagi. Selesaikan sesi sebelumnya untuk memulai sesi baru dengan filter berbeda.

## Menambah konten berikutnya

Konten konsep publik berada di `src/lib/topics.ts`. Soal, kunci, dan pembahasan berada di modul **server-only** `src/lib/content.ts` dan `src/lib/additional-content.ts`. Jangan memindahkan bank lengkap ke frontend.

Untuk menambah soal, tetapkan ID baru yang unik, versi, subtopik, bagian, kesulitan, empat opsi unik dengan tepat satu jawaban benar, dan pembahasan lengkap. Pertahankan konten/ID soal yang sudah digunakan; perbaikan konten harus menggunakan versi baru. Snapshot sesi yang sudah ada tidak boleh ditulis ulang.

Periksa perhitungan secara terpisah dari generator. Tambahkan hasil hitungan independen ke tes bank soal, pastikan satuan dan arti pertanyaan konsisten, lalu jalankan unit test, build, dan E2E alur terkait. Publikasi konten untuk siswa sungguhan memerlukan review matematika/editorial; tes otomatis hanya salah satu tahap.

## Supabase

**Tidak ada SQL baru untuk ekspansi ini.** Soal contoh disediakan oleh server dari repository dan dibekukan dalam snapshot sesi. Tetap jalankan migrasi awal `202610060001_online_learning.sql` jika belum pernah dijalankan. Katalog/admin bank soal di database merupakan pekerjaan lanjutan.
