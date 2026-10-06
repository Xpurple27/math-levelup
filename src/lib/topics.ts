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
  {
    id: "persen",
    name: "Persentase & perubahan",
    domain: "Bilangan & Aritmetika",
    section: "PK",
    concept:
      "Persen berarti per seratus. Kenaikan p% memakai faktor 1+p/100; penurunan p% memakai faktor 1−p/100. Perubahan berturut-turut memakai dasar yang berubah.",
    recognize:
      "Cari diskon, pajak, perubahan harga, atau persentase bagian suatu kelompok. Perhatikan nilai mana yang menjadi dasar persentase.",
    firstStep:
      "Tulis harga atau jumlah awal sebagai A. Ubah setiap persentase menjadi faktor pengali, kemudian terapkan sesuai urutan.",
    example:
      "Harga Rp100.000 didiskon 20%, lalu dikenai pajak 10% pada harga setelah diskon. Berapa harga akhir?",
    solution:
      "Harga setelah diskon = 100.000 × 0,8 = 80.000. Setelah pajak = 80.000 × 1,1 = 88.000 rupiah.",
    mistake:
      "Menjumlahkan persentase berturut-turut padahal dasar perhitungannya berbeda.",
  },
  {
    id: "geometri",
    name: "Luas, keliling & volume",
    domain: "Geometri & Pengukuran",
    section: "PK",
    concept:
      "Keliling adalah panjang batas bangun, luas mengukur permukaan, dan volume mengukur ruang. Persegi panjang: L = p×l, K = 2(p+l). Segitiga: L = ½at. Lingkaran: L = πr², K = 2πr. Balok: V = plt. Tabung: V = πr²t.",
    recognize:
      "Perhatikan apakah yang dicari panjang batas, daerah yang ditutupi, atau kapasitas ruang. Pada bangun gabungan, pisahkan bagian yang ditambah dan dikurangi.",
    firstStep:
      "Tulis ukuran beserta satuannya. Pilih rumus sesuai besaran yang ditanyakan; tinggi segitiga harus tegak lurus alas.",
    example:
      "Taman berukuran 10 m × 6 m dikelilingi jalan selebar 1 m di luar taman. Berapa luas jalan?",
    solution:
      "Ukuran luar menjadi 12 m × 8 m. Luas luar = 96 m², luas taman = 60 m². Luas jalan = 96−60 = 36 m².",
    mistake:
      "Menganggap luas dan keliling sama, mencampur satuan, atau menambahkan lebar jalan hanya pada satu sisi.",
  },
  {
    id: "peluang",
    name: "Peluang & aturan pencacahan",
    domain: "Peluang & Kombinatorika",
    section: "PM",
    concept:
      "Untuk hasil yang sama mungkin, peluang = banyak hasil yang memenuhi / banyak seluruh hasil. Pilihan berurutan memakai aturan perkalian; tim tanpa jabatan memakai kombinasi. Kejadian independen dapat dikalikan peluangnya. Peluang komplemen adalah 1−P(A).",
    recognize:
      "Cari kata acak, pengembalian, independen, minimal satu, atau pemilihan dengan jabatan. Tentukan apakah urutan berpengaruh.",
    firstStep:
      "Tentukan ruang sampel dan kejadian yang ditanyakan. Periksa apakah pilihan berikutnya berubah setelah pilihan pertama.",
    example:
      "Dari lima siswa dipilih dua anggota tim tanpa jabatan. Berapa tim berbeda yang mungkin?",
    solution:
      "Pasangan berurutan = 5×4 = 20. Karena tim A–B sama dengan B–A, bagi dua. Ada 10 tim berbeda.",
    mistake:
      "Menghitung pasangan terbalik dua kali atau menganggap pengambilan tanpa pengembalian independen.",
  },
  {
    id: "pola",
    name: "Pola bilangan & barisan",
    domain: "Logika, Penalaran & Pemodelan",
    section: "PU",
    concept:
      "Barisan aritmetika memiliki beda tetap: Uₙ = a+(n−1)d, Sₙ = n(a+Uₙ)/2. Barisan geometri memiliki rasio tetap: Uₙ = ar^(n−1), Sₙ = a(rⁿ−1)/(r−1) untuk r≠1. Untuk r=1, Sₙ = na.",
    recognize:
      "Bandingkan selisih dan rasio antarsuku. Bedakan suku ke-n (Uₙ) dengan jumlah n suku (Sₙ). Pola dari beberapa angka saja bisa ambigu jika tidak ada aturan yang diberikan.",
    firstStep:
      "Identifikasi suku pertama dan aturan barisan. Cocokkan aturan itu dengan semua suku yang diketahui.",
    example:
      "Baris pertama aula berisi 4 kursi. Tiap baris bertambah 2 kursi. Berapa total kursi pada 8 baris?",
    solution: "a = 4, d = 2. U₈ = 4+7×2 = 18. S₈ = 8(4+18)/2 = 88 kursi.",
    mistake:
      "Menggunakan n alih-alih n−1 dalam rumus suku atau menjawab suku terakhir ketika diminta jumlah.",
  },
];
