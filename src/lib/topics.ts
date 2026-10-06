export const topics = [
  {
    id: "rasio",
    name: "Rasio & perbandingan",
    domain: "Bilangan & Aritmetika",
    section: "PK",
    concept:
      "Rasio membandingkan dua besaran. Jika A : B = a : b, tuliskan A = ak dan B = bk. Faktor k menghubungkan rasio dengan nilai sebenarnya.",
    recognize:
      "Cari kata “perbandingan”, “bagian”, atau dua jumlah yang berubah bersama. Bedakan jumlah total dengan selisih.",
    firstStep:
      "Tuliskan besaran sebagai kelipatan k. Gunakan jumlah atau selisih yang diketahui untuk mencari k.",
    example:
      "Perbandingan buku Rani dan Bima adalah 3 : 5. Total buku mereka 40. Berapa buku Rani?",
    solution:
      "Rani = 3k, Bima = 5k. Maka 8k = 40, sehingga k = 5. Buku Rani = 3 × 5 = 15.",
    mistake:
      "Membagi total dengan satu angka rasio. Untuk total, gunakan jumlah bagian rasio.",
  },
  {
    id: "aljabar",
    name: "Persamaan linear",
    domain: "Aljabar",
    section: "PM",
    concept:
      "Persamaan adalah keseimbangan. Operasi yang sama pada kedua ruas menjaga nilai x. Modelkan besaran yang belum diketahui dengan variabel.",
    recognize:
      "Ada nilai yang belum diketahui, biaya tetap dan biaya per unit, atau hubungan yang dapat ditulis ax + b = c.",
    firstStep:
      "Tentukan arti x dan satuannya. Susun persamaan sebelum menghitung.",
    example:
      "Biaya taksi Rp8.000 ditambah Rp4.000 per km. Total Rp28.000. Berapa jaraknya?",
    solution:
      "Misalkan x jarak dalam km. 4.000x + 8.000 = 28.000. Kurangi 8.000: 4.000x = 20.000. Jadi x = 5 km.",
    mistake:
      "Mengubah hanya satu ruas atau lupa mengurangi biaya tetap sebelum membagi.",
  },
  {
    id: "statistika",
    name: "Rata-rata & interpretasi data",
    domain: "Statistika & Analisis Data",
    section: "PU",
    concept:
      "Rata-rata = jumlah seluruh nilai ÷ banyak data. Rata-rata kelompok gabungan harus mempertimbangkan ukuran setiap kelompok.",
    recognize:
      "Soal menyebut rata-rata, data tambahan, atau dua kelompok berbeda ukuran. Jumlah nilai sering menjadi penghubung.",
    firstStep:
      "Ubah rata-rata menjadi jumlah: jumlah = banyak data × rata-rata.",
    example:
      "Empat siswa memiliki rata-rata 70. Satu siswa dengan nilai 90 bergabung. Berapa rata-rata baru?",
    solution:
      "Jumlah awal = 4 × 70 = 280. Jumlah baru = 280 + 90 = 370. Ada 5 siswa, jadi rata-rata = 370 ÷ 5 = 74.",
    mistake:
      "Merata-ratakan dua rata-rata tanpa memperhatikan banyak anggota kelompok.",
  },
];
