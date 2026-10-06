import "server-only";
import type { Question, Difficulty } from "./content";
type Spec = {
  stem: string;
  answer: number;
  firstStep: string;
  solution: string;
  hint: string;
  mistake: string;
};
type Family = {
  topic: string;
  section: string;
  difficulty: Difficulty;
  variants: (n: number) => Spec;
};
const family = (
  topic: string,
  section: string,
  difficulty: Difficulty,
  variants: Family["variants"],
): Family => ({ topic, section, difficulty, variants });
const families: Family[] = [
  family("persen", "PK", "Basic", (n) => {
    const p = 10 * (n + 1),
      a = 500 + 100 * n;
    return {
      stem: `Berapa ${p}% dari ${a}?`,
      answer: (p * a) / 100,
      firstStep: "Ubah persen menjadi pecahan per seratus.",
      solution: `${p}/100 × ${a} = ${(p * a) / 100}.`,
      hint: "Persen berarti per seratus.",
      mistake: "Memakai persen sebagai bilangan bulat tanpa membagi 100.",
    };
  }),
  family("persen", "PK", "Basic", (n) => ({
    stem: `Dalam persen, berapakah ${n + 1}/5?`,
    answer: 20 * (n + 1),
    firstStep: "Kalikan pecahan dengan 100%.",
    solution: `(${n + 1}/5) × 100% = ${20 * (n + 1)}%.`,
    hint: "Ubah penyebut lima menjadi seratus.",
    mistake: "Mengalikan pembilang tanpa mengalikan penyebut.",
  })),
  family("persen", "PK", "Basic", (n) => {
    const a = 100000 + 50000 * n;
    return {
      stem: `Harga buku Rp${a.toLocaleString("id-ID")} mendapat diskon 10%. Berapa harga akhirnya dalam rupiah?`,
      answer: a * 0.9,
      firstStep: "Harga akhir adalah 90% dari harga awal.",
      solution: `Potongan = ${a / 10}. Harga akhir = ${a} − ${a / 10} = ${a * 0.9}.`,
      hint: "Diskon mengurangi harga, bukan menambahnya.",
      mistake: "Menjawab besar diskon, bukan harga setelah diskon.",
    };
  }),
  family("persen", "PK", "Basic", (n) => {
    const a = 40 + 20 * n;
    return {
      stem: `Anggota klub semula ${a} orang. Jumlahnya bertambah 25%. Berapa anggota sekarang?`,
      answer: a * 1.25,
      firstStep: "Hitung 25% anggota awal, lalu tambahkan.",
      solution: `Tambahan = ${a / 4}. Jumlah baru = ${a}+${a / 4} = ${a * 1.25}.`,
      hint: "25% sama dengan seperempat.",
      mistake: "Mengurangi jumlah padahal terjadi pertambahan.",
    };
  }),
  family("persen", "PK", "Medium", (n) => {
    const a = 100000 + 50000 * n;
    return {
      stem: `Barang berharga Rp${a.toLocaleString("id-ID")} didiskon 10%, lalu dikenai pajak 10% atas harga setelah diskon. Berapa pembayaran dalam rupiah?`,
      answer: a * 0.99,
      firstStep: "Terapkan diskon dulu, kemudian pajak pada harga yang baru.",
      solution: `Harga setelah diskon = ${a * 0.9}. Pajak = ${a * 0.09}. Pembayaran = ${a * 0.9}+${a * 0.09} = ${a * 0.99}.`,
      hint: "Dasar pajak bukan harga awal.",
      mistake: "Menganggap diskon 10% dan pajak 10% saling menghapus.",
    };
  }),
  family("persen", "PK", "Medium", (n) => {
    const a = 100000 + 50000 * n;
    return {
      stem: `Setelah diskon 20%, harga tas Rp${(a * 0.8).toLocaleString("id-ID")}. Berapa harga awalnya dalam rupiah?`,
      answer: a,
      firstStep: "Harga yang diketahui adalah 80% harga awal.",
      solution: `Harga awal = ${a * 0.8} ÷ 0,8 = ${a}.`,
      hint: "Bagi harga akhir dengan faktor 0,8.",
      mistake: "Menambahkan 20% dari harga akhir sebagai harga awal.",
    };
  }),
  family("persen", "PK", "Medium", (n) => {
    const a = 200 * (n + 1);
    return {
      stem: `Dari ${a} siswa, 25% tidak hadir. Berapa siswa yang hadir?`,
      answer: a * 0.75,
      firstStep: "Persentase hadir = 100% − 25%.",
      solution: `Hadir = 75% × ${a} = ${a * 0.75} siswa.`,
      hint: "Gunakan persentase komplemen.",
      mistake: "Menghitung siswa yang tidak hadir.",
    };
  }),
  family("persen", "PK", "Medium", (n) => {
    const a = 160 + 80 * n;
    return {
      stem: `Jumlah produksi turun dari ${a} unit menjadi ${a * 0.75} unit. Berapa persen penurunannya?`,
      answer: 25,
      firstStep: "Bagi selisih produksi dengan jumlah produksi awal.",
      solution: `Penurunan = ${a - a * 0.75}. Persen penurunan = ${a - a * 0.75}/${a} × 100% = 25%.`,
      hint: "Penyebutnya adalah jumlah awal.",
      mistake: "Membagi penurunan dengan produksi akhir.",
    };
  }),
  family("persen", "PK", "Hard", (n) => {
    const a = 100000 * (n + 1);
    return {
      stem: `Harga Rp${a.toLocaleString("id-ID")} naik 20%, lalu turun 10% dari harga baru. Berapa persen perubahan bersih terhadap harga awal?`,
      answer: 8,
      firstStep: "Kalikan faktor 1,2 dan 0,9.",
      solution: `Harga akhir = ${a} × 1,2 × 0,9 = ${a * 1.08}. Faktor bersih 1,08 berarti naik 8%.`,
      hint: "Persentase berturut-turut memakai dasar berbeda.",
      mistake: "Mengurangi 20% − 10% dan menyimpulkan naik 10%.",
    };
  }),
  family("persen", "PK", "Hard", (n) => {
    const a = 200000 * (n + 1);
    return {
      stem: `Harga jaket Rp${a.toLocaleString("id-ID")} didiskon 20%, lalu 25% dari harga setelah diskon pertama. Berapa persen diskon total?`,
      answer: 40,
      firstStep: "Hitung bagian harga yang tersisa setelah kedua diskon.",
      solution: `Harga tersisa = 0,8 × 0,75 = 0,6 harga awal. Diskon total = 1 − 0,6 = 40%.`,
      hint: "Hitung faktor harga sisa, bukan jumlah persen diskon.",
      mistake: "Menjumlahkan 20% dan 25% menjadi 45%.",
    };
  }),
  family("persen", "PK", "Hard", (n) => {
    const a = 80000 * (n + 1);
    return {
      stem: `Pedagang menaikkan harga modal Rp${a.toLocaleString("id-ID")} sebesar 25%, lalu memberi diskon 20%. Berapa persen keuntungan terhadap modal?`,
      answer: 0,
      firstStep: "Bandingkan harga jual akhir dengan modal.",
      solution: `Faktor jual = 1,25 × 0,8 = 1. Harga jual sama dengan modal (${a}), jadi keuntungan 0%.`,
      hint: "Gunakan faktor pengali, bukan selisih persentase.",
      mistake: "Mengira keuntungan tetap 5% dari selisih dua persentase.",
    };
  }),
  family("persen", "PK", "Hard", (n) => {
    const a = 100000 * (n + 1);
    return {
      stem: `Pendapatan naik dari Rp${a.toLocaleString("id-ID")} menjadi Rp${(a * 1.25).toLocaleString("id-ID")}. Agar kembali ke nilai awal, berapa persen harus diturunkan dari nilai baru?`,
      answer: 20,
      firstStep: "Gunakan pendapatan baru sebagai dasar persentase penurunan.",
      solution: `Penurunan = ${a * 0.25}. Persen = ${a * 0.25}/${a * 1.25} × 100% = 20%.`,
      hint: "Naik dan turun menggunakan dasar yang berbeda.",
      mistake: "Menganggap kenaikan 25% harus dibalik dengan penurunan 25%.",
    };
  }),
  family("geometri", "PK", "Basic", (n) => {
    const p = 8 + 2 * n,
      l = 4 + n;
    return {
      stem: `Persegi panjang memiliki panjang ${p} cm dan lebar ${l} cm. Berapa luasnya dalam cm²?`,
      answer: p * l,
      firstStep: "Gunakan luas = panjang × lebar.",
      solution: `Luas = ${p} × ${l} = ${p * l} cm².`,
      hint: "Bedakan luas dari keliling.",
      mistake: "Menjumlahkan panjang dan lebar.",
    };
  }),
  family("geometri", "PK", "Basic", (n) => {
    const s = 5 + n;
    return {
      stem: `Sebuah persegi memiliki sisi ${s} cm. Berapa kelilingnya dalam cm?`,
      answer: 4 * s,
      firstStep: "Persegi mempunyai empat sisi sama panjang.",
      solution: `Keliling = 4 × ${s} = ${4 * s} cm.`,
      hint: "Keliling adalah total panjang sisi.",
      mistake: "Menghitung kuadrat sisi, yang menghasilkan luas.",
    };
  }),
  family("geometri", "PK", "Basic", (n) => {
    const a = 10 + 2 * n,
      t = 6;
    return {
      stem: `Segitiga mempunyai alas ${a} cm dan tinggi tegak lurus ${t} cm. Berapa luasnya dalam cm²?`,
      answer: (a * t) / 2,
      firstStep: "Gunakan setengah hasil kali alas dan tinggi.",
      solution: `Luas = ½ × ${a} × ${t} = ${(a * t) / 2} cm².`,
      hint: "Segitiga adalah setengah persegi panjang dengan alas dan tinggi sama.",
      mistake: "Melupakan faktor setengah.",
    };
  }),
  family("geometri", "PK", "Basic", (n) => {
    const p = 3 + n,
      l = 4,
      t = 5;
    return {
      stem: `Balok berukuran ${p} cm × ${l} cm × ${t} cm. Berapa volumenya dalam cm³?`,
      answer: p * l * t,
      firstStep: "Kalikan tiga dimensi balok.",
      solution: `Volume = ${p} × ${l} × ${t} = ${p * l * t} cm³.`,
      hint: "Volume membutuhkan panjang, lebar, dan tinggi.",
      mistake: "Menghitung luas satu sisi saja.",
    };
  }),
  family("geometri", "PK", "Medium", (n) => {
    const k = n + 1;
    return {
      stem: `Segitiga siku-siku memiliki sisi tegak ${3 * k} cm dan ${4 * k} cm. Berapa panjang sisi miring dalam cm?`,
      answer: 5 * k,
      firstStep: "Terapkan teorema Pythagoras pada sisi tegak.",
      solution: `c² = (${3 * k})² + (${4 * k})² = ${25 * k * k}. Maka c = ${5 * k} cm.`,
      hint: "Sisi miring adalah akar jumlah kuadrat dua sisi tegak.",
      mistake: "Menjumlahkan panjang kedua sisi secara langsung.",
    };
  }),
  family("geometri", "PK", "Medium", (n) => {
    const r = 7 * (n + 1);
    return {
      stem: `Lingkaran berjari-jari ${r} cm. Gunakan π = 22/7. Berapa kelilingnya dalam cm?`,
      answer: 44 * (n + 1),
      firstStep: "Gunakan keliling lingkaran = 2πr.",
      solution: `Keliling = 2 × 22/7 × ${r} = ${44 * (n + 1)} cm.`,
      hint: "Jari-jari bukan diameter.",
      mistake: "Menggunakan πr² yang merupakan rumus luas.",
    };
  }),
  family("geometri", "PK", "Medium", (n) => {
    const l = 4 + n,
      p = l + 3;
    return {
      stem: `Keliling persegi panjang ${2 * (p + l)} cm. Panjangnya ${p} cm. Berapa lebarnya dalam cm?`,
      answer: l,
      firstStep: "Bagi keliling dua untuk memperoleh panjang + lebar.",
      solution: `Lebar = ${2 * (p + l)} ÷ 2 − ${p} = ${l} cm.`,
      hint: "Keliling mencakup dua pasang sisi.",
      mistake: "Mengurangi panjang dari keliling penuh.",
    };
  }),
  family("geometri", "PK", "Medium", (n) => {
    const s = 6 + 2 * n;
    return {
      stem: `Sebuah kubus mempunyai panjang rusuk ${s} cm. Berapa luas permukaannya dalam cm²?`,
      answer: 6 * s * s,
      firstStep: "Kubus mempunyai enam sisi berbentuk persegi.",
      solution: `Luas permukaan = 6 × ${s}² = ${6 * s * s} cm².`,
      hint: "Luas permukaan adalah jumlah luas enam sisi.",
      mistake: "Menggunakan s³ yang merupakan volume.",
    };
  }),
  family("geometri", "PK", "Hard", (n) => {
    const p = 10 + 2 * n,
      l = 6 + n,
      w = 1;
    return {
      stem: `Taman persegi panjang ${p} m × ${l} m dikelilingi jalan selebar ${w} m di luar taman. Berapa luas jalan dalam m²?`,
      answer: (p + 2) * (l + 2) - p * l,
      firstStep:
        "Ukuran luar bertambah dua kali lebar jalan pada setiap dimensi.",
      solution: `Luas luar = ${p + 2} × ${l + 2} = ${(p + 2) * (l + 2)}. Kurangi luas taman ${p * l}, diperoleh ${(p + 2) * (l + 2) - p * l} m².`,
      hint: "Jalan ada di kedua sisi setiap dimensi.",
      mistake: "Menambahkan lebar jalan hanya sekali.",
    };
  }),
  family("geometri", "PK", "Hard", (n) => {
    const a = 2 + n;
    return {
      stem: `Dua bangun sebangun memiliki perbandingan panjang sisi 1 : ${a}. Berapa rasio luas bangun besar terhadap bangun kecil?`,
      answer: a * a,
      firstStep: "Faktor luas adalah kuadrat faktor panjang.",
      solution: `Faktor panjang ${a}, maka faktor luas ${a}² = ${a * a}. Rasio luas besar/kecil adalah ${a * a}.`,
      hint: "Luas berubah dalam dua dimensi.",
      mistake: "Menggunakan faktor panjang sebagai faktor luas.",
    };
  }),
  family("geometri", "PK", "Hard", (n) => {
    const p = 10 + 2 * n,
      l = 8 + n,
      x = 4,
      y = 3;
    return {
      stem: `Karton ${p} cm × ${l} cm dipotong sebuah persegi panjang ${x} cm × ${y} cm pada sudutnya. Berapa luas karton tersisa dalam cm²?`,
      answer: p * l - x * y,
      firstStep: "Kurangi luas bagian yang dipotong dari luas seluruh karton.",
      solution: `Luas awal = ${p * l}. Potongan = 4 × 3 = 12. Sisa = ${p * l - 12} cm².`,
      hint: "Luas gabungan bisa dihitung melalui pengurangan.",
      mistake: "Mengurangi ukuran sisi, bukan luas potongan.",
    };
  }),
  family("geometri", "PK", "Hard", (n) => {
    const r = 7,
      h = 3 + n;
    return {
      stem: `Tabung berjari-jari ${r} cm dan tinggi ${h} cm. Gunakan π = 22/7. Berapa volumenya dalam cm³?`,
      answer: 154 * h,
      firstStep: "Volume tabung adalah luas alas lingkaran × tinggi.",
      solution: `V = 22/7 × 7² × ${h} = 154 × ${h} = ${154 * h} cm³.`,
      hint: "Alas berbentuk lingkaran, bukan persegi.",
      mistake:
        "Menggunakan diameter sebagai jari-jari atau tidak menguadratkan r.",
    };
  }),
  family("peluang", "PM", "Basic", (n) => {
    const red = 2 + n,
      total = 10;
    return {
      stem: `Kantong berisi ${red} bola merah dan ${total - red} bola biru. Satu bola dipilih acak. Berapa persen peluang mendapat merah?`,
      answer: 10 * red,
      firstStep: "Bagi banyak bola merah dengan total bola.",
      solution: `P(merah) = ${red}/10 = ${10 * red}%.`,
      hint: "Setiap bola dianggap sama mungkin terambil.",
      mistake: "Membagi jumlah merah dengan jumlah biru saja.",
    };
  }),
  family("peluang", "PM", "Basic", (n) => {
    const target = [2, 4, 6][n];
    return {
      stem: `Sebuah dadu adil dilempar sekali. Berapa banyak hasil yang mungkin bernilai paling besar ${target}?`,
      answer: target,
      firstStep: "Daftar hasil dari 1 sampai batas yang diberikan.",
      solution: `Hasil yang memenuhi adalah 1 sampai ${target}, sehingga ada ${target} hasil.`,
      hint: "Dadu memiliki hasil 1 sampai 6.",
      mistake: "Menghitung hasil di atas batas.",
    };
  }),
  family("peluang", "PM", "Basic", (n) => ({
    stem: `Ada ${2 + n} pilihan baju dan 3 pilihan celana. Berapa kombinasi satu baju dan satu celana?`,
    answer: (2 + n) * 3,
    firstStep: "Gunakan aturan perkalian.",
    solution: `Kombinasi = ${2 + n} × 3 = ${(2 + n) * 3}.`,
    hint: "Setiap baju dapat dipasangkan dengan semua celana.",
    mistake: "Menjumlahkan pilihan dua kelompok.",
  })),
  family("peluang", "PM", "Basic", (n) => {
    const win = 10 * (n + 1);
    return {
      stem: `Peluang sebuah permainan menang ${win}%. Tidak ada hasil seri. Berapa persen peluang kalah?`,
      answer: 100 - win,
      firstStep: "Menang dan kalah adalah kejadian komplemen.",
      solution: `P(kalah) = 100% − ${win}% = ${100 - win}%.`,
      hint: "Jumlah peluang semua hasil adalah 100%.",
      mistake: "Menganggap peluang kalah selalu sama dengan peluang menang.",
    };
  }),
  family("peluang", "PM", "Medium", (n) => {
    const sides = n + 2;
    return {
      stem: `Sebuah pemutar adil memiliki ${sides} sektor bernomor 1 sampai ${sides}. Diputar dua kali secara independen. Berapa banyak pasangan hasil berurutan?`,
      answer: sides * sides,
      firstStep:
        "Setiap hasil putaran pertama berpasangan dengan semua hasil putaran kedua.",
      solution: `Banyak pasangan berurutan = ${sides} × ${sides} = ${sides * sides}.`,
      hint: "Urutan putaran termasuk dalam hasil.",
      mistake: "Menganggap pasangan terbalik adalah satu hasil yang sama.",
    };
  }),
  family("peluang", "PM", "Medium", (n) => {
    const people = n + 4;
    return {
      stem: `Dari ${people} siswa dipilih satu ketua dan satu wakil berbeda. Berapa susunan jabatan yang mungkin?`,
      answer: people * (people - 1),
      firstStep: "Ketua punya n pilihan; wakil punya n−1.",
      solution: `Susunan = ${people} × ${people - 1} = ${people * (people - 1)}.`,
      hint: "Peran ketua dan wakil berbeda.",
      mistake: "Membagi dua padahal jabatan memiliki urutan.",
    };
  }),
  family("peluang", "PM", "Medium", (n) => {
    const red = n + 3,
      total = 10;
    return {
      stem: `Kantong berisi ${red} bola merah dan ${total - red} biru. Dua bola dipilih tanpa pengembalian. Jika pertama merah, berapa bola merah yang masih mungkin terambil pada pilihan kedua?`,
      answer: red - 1,
      firstStep: "Kurangi satu bola merah yang sudah diambil.",
      solution: `Bola merah tersisa = ${red} − 1 = ${red - 1}. Total bola tersisa 9.`,
      hint: "Tanpa pengembalian mengubah isi kantong.",
      mistake: "Menggunakan jumlah bola merah awal.",
    };
  }),
  family("peluang", "PM", "Medium", (n) => {
    const people = n + 4;
    return {
      stem: `Dari ${people} siswa dipilih dua anggota tim tanpa jabatan. Berapa tim berbeda yang mungkin?`,
      answer: (people * (people - 1)) / 2,
      firstStep:
        "Hitung pasangan, kemudian bagi dua karena urutan tidak penting.",
      solution: `Tim = C(${people},2) = ${people} × ${people - 1} / 2 = ${(people * (people - 1)) / 2}.`,
      hint: "Tim A–B sama dengan tim B–A.",
      mistake: "Menghitung setiap pasangan dua kali.",
    };
  }),
  family("peluang", "PM", "Hard", (n) => {
    const red = n + 2,
      total = 10;
    return {
      stem: `Kantong berisi ${red} bola merah dan ${total - red} biru. Dua bola diambil dengan pengembalian. Berapa persen peluang keduanya merah?`,
      answer: red * red,
      firstStep: "Dengan pengembalian, peluang merah setiap pengambilan tetap.",
      solution: `P = (${red}/10) × (${red}/10) = ${red * red}/100 = ${red * red}%.`,
      hint: "Kedua pengambilan independen.",
      mistake: "Menjumlahkan peluang untuk kejadian “keduanya”.",
    };
  }),
  family("peluang", "PM", "Hard", (n) => {
    const people = n + 5;
    return {
      stem: `Dari ${people} siswa dipilih tiga anggota tim tanpa jabatan. Berapa tim berbeda yang mungkin?`,
      answer: (people * (people - 1) * (people - 2)) / 6,
      firstStep: "Gunakan kombinasi karena urutan anggota tidak penting.",
      solution: `C(${people},3) = ${people} × ${people - 1} × ${people - 2} / 6 = ${(people * (people - 1) * (people - 2)) / 6}.`,
      hint: "Setiap susunan tiga anggota terhitung 3! kali.",
      mistake: "Menggunakan permutasi untuk tim tanpa jabatan.",
    };
  }),
  family("peluang", "PM", "Hard", (n) => {
    const a = 2 + n,
      b = 3;
    return {
      stem: `Sebuah sandi memiliki dua digit: digit pertama dari ${a} pilihan dan digit kedua dari ${b} pilihan. Ada satu sandi yang benar. Jika semua sandi sama mungkin dicoba, berapa banyak sandi yang salah?`,
      answer: a * b - 1,
      firstStep: "Hitung seluruh sandi, lalu keluarkan satu sandi yang benar.",
      solution: `Total = ${a} × 3 = ${a * b}. Sandi salah = ${a * b} − 1 = ${a * b - 1}.`,
      hint: "Gunakan komplemen setelah aturan perkalian.",
      mistake: "Mengurangi satu dari setiap kelompok pilihan.",
    };
  }),
  family("peluang", "PM", "Hard", (n) => {
    const p = 20 + 10 * n;
    return {
      stem: `Dua percobaan independen masing-masing memiliki peluang gagal ${p}%. Berapa persen peluang minimal satu berhasil?`,
      answer: 100 - (p * p) / 100,
      firstStep:
        "Gunakan komplemen: tidak ada yang berhasil berarti keduanya gagal.",
      solution: `P(keduanya gagal) = ${p}/100 × ${p}/100 = ${(p * p) / 100}%. Maka minimal satu berhasil = ${100 - (p * p) / 100}%.`,
      hint: "“Minimal satu” mencakup tepat satu dan keduanya berhasil.",
      mistake: "Menghitung hanya tepat satu berhasil.",
    };
  }),
  family("pola", "PU", "Basic", (n) => {
    const a = 2 + n,
      d = 3;
    return {
      stem: `Barisan ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, … memiliki selisih tetap. Berapa suku berikutnya?`,
      answer: a + 4 * d,
      firstStep: "Cari selisih dua suku berurutan.",
      solution: `Selisih selalu 3. Suku berikutnya ${a + 3 * d} + 3 = ${a + 4 * d}.`,
      hint: "Coba operasi penjumlahan dengan bilangan tetap.",
      mistake: "Mengalikan suku saat selisihnya tetap.",
    };
  }),
  family("pola", "PU", "Basic", (n) => {
    const a = 2 + n;
    return {
      stem: `Barisan ${a}, ${2 * a}, ${4 * a}, ${8 * a}, … memiliki rasio tetap. Berapa suku berikutnya?`,
      answer: 16 * a,
      firstStep: "Bandingkan dua suku berurutan dengan pembagian.",
      solution: `Rasio adalah 2. Suku berikutnya ${8 * a} × 2 = ${16 * a}.`,
      hint: "Setiap suku dua kali suku sebelumnya.",
      mistake: "Menganggap selisih antarsuku selalu sama.",
    };
  }),
  family("pola", "PU", "Basic", (n) => {
    const a = 30 + 4 * n;
    return {
      stem: `Barisan ${a}, ${a - 4}, ${a - 8}, ${a - 12}, … memiliki selisih tetap. Berapa suku berikutnya?`,
      answer: a - 16,
      firstStep: "Perhatikan barisan berkurang dengan selisih empat.",
      solution: `Suku berikutnya = ${a - 12} − 4 = ${a - 16}.`,
      hint: "Selisih barisan dapat negatif.",
      mistake: "Menambahkan empat karena mengabaikan arah penurunan.",
    };
  }),
  family("pola", "PU", "Basic", (n) => {
    const a = n + 1;
    return {
      stem: `Barisan kuadrat bilangan bulat berurutan dimulai ${a * a}, ${(a + 1) ** 2}, ${(a + 2) ** 2}, ${(a + 3) ** 2}. Berapa suku berikutnya?`,
      answer: (a + 4) ** 2,
      firstStep: "Kenali setiap suku sebagai kuadrat.",
      solution: `Suku-sukunya ${a}², ${a + 1}², ${a + 2}², ${a + 3}². Berikutnya ${a + 4}² = ${(a + 4) ** 2}.`,
      hint: "Cari bilangan yang jika dikuadratkan menghasilkan tiap suku.",
      mistake: "Menggunakan selisih terakhir sebagai selisih tetap.",
    };
  }),
  family("pola", "PU", "Medium", (n) => {
    const a = 3 + n,
      d = 2,
      k = 10;
    return {
      stem: `Barisan aritmetika mempunyai suku pertama ${a} dan beda ${d}. Berapa suku ke-${k}?`,
      answer: a + (k - 1) * d,
      firstStep: "Gunakan Uₖ = a + (k−1)d.",
      solution: `U₁₀ = ${a} + 9 × 2 = ${a + 18}.`,
      hint: "Ada sembilan langkah dari suku pertama ke suku kesepuluh.",
      mistake: "Memakai k × d sehingga bergeser satu suku.",
    };
  }),
  family("pola", "PU", "Medium", (n) => {
    const a = 2 + n,
      k = 5;
    return {
      stem: `Barisan geometri mempunyai suku pertama ${a} dan rasio 2. Berapa suku ke-${k}?`,
      answer: a * 16,
      firstStep: "Gunakan Uₖ = a × r^(k−1).",
      solution: `U₅ = ${a} × 2⁴ = ${a * 16}.`,
      hint: "Pangkatnya satu kurang dari nomor suku.",
      mistake: "Mengalikan nomor suku dengan rasio.",
    };
  }),
  family("pola", "PU", "Medium", (n) => {
    const a = 2 + n,
      b = a + 12;
    return {
      stem: `Suku pertama suatu barisan aritmetika ${a}; suku kelima ${b}. Berapa bedanya?`,
      answer: 3,
      firstStep: "Dari suku pertama ke kelima ada empat selisih.",
      solution: `4d = ${b} − ${a} = 12, sehingga d = 3.`,
      hint: "Jumlah selisih bukan lima.",
      mistake: "Membagi selisih nilai dengan lima.",
    };
  }),
  family("pola", "PU", "Medium", (n) => {
    const a = 2 + n;
    return {
      stem: `Suatu pola memenuhi Uₖ = 3k + ${a}. Berapa nilai U₇?`,
      answer: 21 + a,
      firstStep: "Substitusikan k = 7 ke rumus.",
      solution: `U₇ = 3 × 7 + ${a} = ${21 + a}.`,
      hint: "Nomor suku menggantikan k.",
      mistake: "Mengganti k dengan nilai suku sebelumnya.",
    };
  }),
  family("pola", "PU", "Hard", (n) => {
    const a = 2 + n,
      k = 10,
      d = 2;
    return {
      stem: `Berapa jumlah ${k} suku pertama barisan aritmetika dengan suku awal ${a} dan beda ${d}?`,
      answer: (k * (2 * a + (k - 1) * d)) / 2,
      firstStep: "Cari suku terakhir, kemudian gunakan jumlah = n(a+Uₙ)/2.",
      solution: `U₁₀ = ${a + 18}. Jumlah = 10 × (${a}+${a + 18}) / 2 = ${10 * a + 90}.`,
      hint: "Yang ditanyakan jumlah suku, bukan suku kesepuluh.",
      mistake: "Menjawab Uₙ alih-alih Sₙ.",
    };
  }),
  family("pola", "PU", "Hard", (n) => {
    const a = 2 + n;
    return {
      stem: `Berapa jumlah lima suku pertama barisan geometri dengan suku awal ${a} dan rasio 2?`,
      answer: 31 * a,
      firstStep: "Gunakan Sₙ = a(rⁿ−1)/(r−1).",
      solution: `S₅ = ${a} × (2⁵−1)/(2−1) = ${a} × 31 = ${31 * a}.`,
      hint: "Jumlah lima suku dapat diperiksa dengan a+2a+4a+8a+16a.",
      mistake: "Menjumlahkan hanya empat suku.",
    };
  }),
  family("pola", "PU", "Hard", (n) => {
    const a = 3 + n,
      d = 2;
    return {
      stem: `Baris pertama kursi aula berisi ${a} kursi. Setiap baris berikutnya bertambah ${d} kursi. Jika ada 8 baris, berapa total kursi?`,
      answer: (8 * (2 * a + 7 * d)) / 2,
      firstStep: "Modelkan banyak kursi sebagai barisan aritmetika.",
      solution: `Baris ke-8 = ${a + 14}. Total = 8 × (${a}+${a + 14})/2 = ${8 * a + 56}.`,
      hint: "Gunakan jumlah deret untuk semua baris.",
      mistake: "Mengalikan jumlah kursi baris terakhir dengan jumlah baris.",
    };
  }),
  family("pola", "PU", "Hard", (n) => {
    const a = 4 + n;
    return {
      stem: `Barisan aritmetika mempunyai U₃ = ${a + 6} dan U₇ = ${a + 18}. Berapa suku pertamanya?`,
      answer: a,
      firstStep: "Kurangi dua persamaan suku untuk mencari beda.",
      solution: `4d = ${a + 18} − ${a + 6} = 12, maka d = 3. U₁ = U₃ − 2d = ${a + 6} − 6 = ${a}.`,
      hint: "U₃ dan U₇ terpisah empat selisih.",
      mistake: "Mengurangi tiga beda dari U₃, bukan dua.",
    };
  }),
];
export const additionalBank: Question[] = families.flatMap((f, i) =>
  Array.from({ length: 3 }, (_, n) => {
    const q = f.variants(n),
      correct = (i * 3 + n) % 4;
    // The varied options are unique numeric distractors, with the exact answer inserted once.
    const options = [
      q.answer + 1,
      q.answer + 3,
      q.answer + 7,
      q.answer + 11,
    ].map(String);
    options[correct] = String(q.answer);
    return {
      id: `${f.topic}-f${(i % 12) + 1}-v${n + 1}`,
      version: 1,
      topic: f.topic,
      section: f.section,
      difficulty: f.difficulty,
      stem: q.stem,
      options,
      correct,
      hint: q.hint,
      explanation: {
        understanding:
          "Tentukan besaran yang diminta dan gunakan satuan yang tertera.",
        firstStep: q.firstStep,
        solution: q.solution,
        mistake: q.mistake,
      },
    };
  }),
);
