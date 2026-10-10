import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page" id="content">
      <span className="public-kicker">404 · HALAMAN TIDAK DITEMUKAN</span>
      <h1>Sepertinya kamu keluar jalur.</h1>
      <p>Halaman ini tidak tersedia atau aksesnya memang tidak diberikan untuk akunmu.</p>
      <Link className="public-cta" href="/"><ArrowLeft size={17} /> Kembali ke beranda</Link>
    </main>
  );
}
