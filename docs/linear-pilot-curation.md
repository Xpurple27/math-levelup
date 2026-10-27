# Kandidat alur PLSV — rencana kurasi untuk reviewer

Status: **proposal kurasi, belum diimpor atau dipublikasikan**. Materi paling siap adalah `LM-PK-LIN-01`, subtopic `14000000-0000-4000-8000-000000000002`.

## Paket yang diperlukan

| Komponen         | Referensi / prasyarat                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Materi           | Tiga lesson yang sudah terbit; review matematis/editorial dan alt text/media bila ada                                                                       |
| Practice terarah | Usulkan paket FREE dengan lima versi PK-LIN-001–005: `25000000-0000-4000-8000-000000000501` sampai `...505`; cek ulang versi/current tepat sebelum penautan |
| Mini             | Kontrak aplikasi: 3 Medium + 2 Hard. Tersedia tiga Medium dan satu Hard; diperlukan minimal satu Hard yang disetujui                                        |
| Soal baru setara | Untuk mengurangi efek ingatan, lebih baik tambah set terpisah 3 Medium + 2 Hard; validasi konstruk, cakupan dan beban waktu, bukan sekadar mengganti angka  |

Jika hanya melengkapi satu Hard, mini akan menggunakan ulang empat dari lima butir practice, atau lebih jika butir baru muncul pada diagnostic. Hasil **tidak boleh** dipakai mengklaim peningkatan kemampuan independen. UI patch melaporkan paparan dari 30 sesi terakhir dan confidence tetap menghitung ID unik.

## Kandidat satu Hard untuk pemeriksaan manusia

Kode usulan: `VECTRA-PILOT-LIN-CANDIDATE-01`. Bukan version ID baru; jangan membuat duplicate jika kode/isi serupa ternyata sudah tersedia ketika proses impor dilakukan.

Konstruk: Aljabar, persamaan linear berparameter; menggabungkan syarat solusi tunggal dan interval akar. Kesulitan **Hard editorial sementara**, estimasi 90–120 detik; memerlukan peninjauan kesesuaian waktu PK dan taxonomy. Soal ini orisinal untuk proposal ini, bukan soal resmi/bocoran.

Untuk bilangan real $a$, persamaan $(a^2-9)x=(a-3)(a+2)$ mempunyai tepat satu solusi yang memenuhi $0<x<\frac12$. Himpunan semua nilai $a$ yang memenuhi adalah ....

A. $-3<a<-2$  
B. $-2<a<-1$  
C. $a<-3$ atau $-2<a<-1$  
D. $-2<a<3$, dengan $a\ne-1$  
E. $-2\le a\le-1$

Kandidat kunci: **B**. Status: **DRAFT / pending independent mathematical and editorial review**.

Diketahui: bentuk linear dalam x, parameter real dan interval akar terbuka. Ditanyakan: seluruh parameter yang memenuhi, termasuk pemeriksaan solusi tunggal.

Lintasan 1:

1. Untuk a=3, kedua ruas nol sehingga solusi tidak tunggal. Untuk a=−3, persamaan menjadi 0=6 sehingga tidak ada solusi.
2. Untuk a≠±3, akar adalah $x=(a+2)/(a+3)=1-1/(a+3)$.
3. Bila a+3<0, x>1, tidak memenuhi. Bila a+3>0, syarat x>0 memberi a+3>1; syarat x<1/2 memberi a+3<2.
4. Maka 1<a+3<2, yaitu −2<a<−1. Interval ini otomatis mengecualikan ±3.

Lintasan 2: balik hubungan menjadi $a=(2-3x)/(x-1)$. Turunannya $1/(x-1)^2>0$, sehingga fungsi naik pada 0<x<1/2; nilai batasnya −2 dan −1, dengan kedua ujung tidak termasuk. Alternatif verifikasi tanpa kalkulus: dari x=1−1/t, t>0 dan 0<x<1/2 berarti 1<t<2. Substitusi a=−3/2 memberi x=1/3 dan memenuhi kedua ruas.

Pengecoh A: mengabaikan tanda akar pada −3<a<−2. C: gagal mengevaluasi tanda penyebut negatif, yang membuat x>1. D: hanya memeriksa salah satu batas akar dan nilai parameter khusus. E: memasukkan ujung yang menghasilkan x=0 atau x=1/2. Diagnosis: `syarat-domain`, `kasus-terlewat`, `pertidaksamaan`.

Takeaway: penyederhanaan faktor harus didahului pemeriksaan parameter yang membatalkan koefisien x. Belajar berikutnya: persamaan linear berparameter dan interpretasi batas terbuka.

Reviewer perlu memutuskan apakah butir ini terlalu luas untuk PLSV dan lebih sesuai ke Persamaan & Pertidaksamaan dalam taxonomy V2. Jangan memindahkan histori taxonomy atau menautkan paket otomatis hanya demi memenuhi kuota.
