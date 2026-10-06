# LevelUP-Math — Work Handoff Package

## Tujuan
Paket ini dibuat untuk memindahkan proyek **LevelUP-Math** dari diskusi arsitektur di ChatGPT biasa ke **ChatGPT Work / Codex** agar implementasi dapat dilanjutkan secara lebih efisien, dengan workflow local-first dan push GitHub seminimal mungkin.

## Prinsip Utama
- LevelUP-Math adalah **produk baru**, bukan sekadar lanjutan LevelUP Academy V2.
- Gunakan **repo baru**: `Xpurple27/LevelUP-Math`.
- LevelUP Academy V1 dan V2 hanya menjadi **referensi**.
- Ambil:
  - dari V1: simplicity, kecepatan, UX yang langsung terasa;
  - dari V2: strong core, security, trusted scoring, versioning, autosave, result integrity.
- Jangan mengulang overengineering V2.
- Gunakan prinsip: **V1-speed + V2-safety**.
- Jangan implementasikan seluruh arsitektur sekaligus.
- Bangun vertical slice yang benar-benar usable.

## Urutan Baca
1. `01_PRODUCT_VISION_AND_SCOPE.md`
2. `02_USER_FLOWS_01_06.md`
3. `03_CONTENT_ARCHITECTURE_CA01_CA04.md`
4. `04_DATA_ARCHITECTURE_DA01_DA04.md`
5. `05_DATA_ARCHITECTURE_DA05_DA08.md`
6. `06_SYSTEM_ARCHITECTURE_AND_CODEBASE_STRATEGY.md`
7. `07_REPO_AND_ENGINEERING_WORKFLOW.md`
8. `08_WORK_EXECUTION_PROMPT.md`

## Tugas Pertama Work
Jangan langsung membuat banyak fitur.

### Phase 0 — Bootstrap
1. Pastikan repo baru `Xpurple27/LevelUP-Math` tersedia dan kosong / minimal.
2. Scaffold:
   - Next.js App Router
   - TypeScript
   - Tailwind
   - Supabase
   - Vitest
   - Playwright
3. Buat struktur modular sederhana.
4. Buat dokumentasi source of truth.
5. Buat CI minimal dan path-aware.
6. Jangan menyalin seluruh LevelUP Academy V2.

### Vertical Slice Pertama
Target pertama yang harus usable:

> Login → Diagnostic → Result Weakness → Learn → Practice → Progress Update

Bukan payment, leaderboard, AI, atau analytics kompleks.

## Rules untuk Work
- Kerjakan local-first.
- Jalankan lint/typecheck/test/build sebelum push.
- Jangan push setiap edit kecil.
- Batch perubahan koheren.
- Gunakan GitHub Actions hanya saat benar-benar perlu.
- Jangan membuat abstraction yang belum dibutuhkan.
- Jangan menambah fitur di luar scope yang dikunci.
