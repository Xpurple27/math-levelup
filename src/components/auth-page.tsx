"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

type Mode = "login" | "register";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.61A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.32-1.93V7.46H3.05A10 10 0 0 0 2 12c0 1.62.39 3.15 1.05 4.54l3.35-2.61Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.46l3.35 2.61C7.19 7.7 9.4 5.94 12 5.94Z" />
    </svg>
  );
}

export function AuthPage({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  async function finishLogin() {
    const me = await fetch("/api/me", { cache: "no-store" });
    if (!me.ok) {
      router.push("/app");
      return;
    }
    const data = await me.json();
    if (data.role === "ADMIN") router.push("/admin");
    else if (data.role === "REVIEWER") router.push("/reviewer");
    else router.push("/app");
    router.refresh();
  }

  function loginWithGoogle() {
    setError("");
    setBusy(true);
    window.location.assign("/auth/google");
  }

  async function submit(form: HTMLFormElement) {
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(form));
      const response = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, ...data }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Permintaan gagal diproses.");
      if (payload.confirmationRequired) {
        sessionStorage.setItem("levelup-email-confirmation", "pending");
        setConfirmation(true);
        return;
      }
      sessionStorage.removeItem("levelup-email-confirmation");
      await finishLogin();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Koneksi gagal. Silakan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page-shell">
      <Link href="/" className="auth-back">
        <ArrowLeft size={16} /> Kembali
      </Link>
      <section className="auth-brand-panel">
        <Link className="public-brand" href="/">
          <span className="public-brand-mark">LU</span>
          <span>
            LevelUP <small>Math</small>
          </span>
        </Link>
        <div>
          <span className="public-kicker">RUANG BELAJAR YANG PUNYA ARAH</span>
          <h1>
            {mode === "login"
              ? "Lanjutkan dari titik terakhir."
              : "Mulai dengan mengenali dirimu."}
          </h1>
          <p>
            Diagnostik, pembelajaran, latihan, dan tryout terhubung dalam satu
            progres yang bisa kamu lihat kembali.
          </p>
        </div>
        <div className="auth-brand-note">
          <GraduationCap size={20} /> Dibangun untuk persiapan matematika UTBK.
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          {confirmation ? (
            <div className="confirmation-state">
              <CheckCircle2 size={38} />
              <span className="public-kicker">CEK EMAILMU</span>
              <h2>Konfirmasi email terlebih dahulu.</h2>
              <p>
                Kami sudah mengirim tautan verifikasi. Setelah dikonfirmasi,
                kembali ke halaman masuk.
              </p>
              <Link className="public-cta" href="/login">
                Ke halaman masuk <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <span className="auth-form-label">
                {mode === "login" ? "MASUK KE AKUN" : "BUAT AKUN BARU"}
              </span>
              <h2>
                {mode === "login"
                  ? "Selamat datang kembali."
                  : "Mulai perjalananmu."}
              </h2>
              <p className="auth-intro">
                {mode === "login"
                  ? "Masuk untuk melanjutkan progres belajarmu."
                  : "Akunmu menyimpan hasil, rekomendasi, dan progres belajar."}
              </p>

              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={busy}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[#dfd4d5] bg-white px-4 py-3 text-sm font-extrabold text-[#3c2d2f] shadow-sm transition hover:border-[#c9b7b9] hover:bg-[#fffaf8] disabled:cursor-wait disabled:opacity-60"
              >
                <GoogleMark />
                {busy ? "Menghubungkan…" : "Lanjutkan dengan Google"}
              </button>

              <div className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a08d8f]">
                <span className="h-px flex-1 bg-[#eadfe0]" />
                atau dengan email
                <span className="h-px flex-1 bg-[#eadfe0]" />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit(event.currentTarget);
                }}
              >
                {mode === "register" && (
                  <label className="auth-field">
                    Nama lengkap
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Nama kamu"
                    />
                  </label>
                )}
                <label className="auth-field">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="kamu@email.com"
                  />
                </label>
                <label className="auth-field">
                  Kata sandi
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={mode === "register" ? 8 : 1}
                    maxLength={200}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    placeholder={
                      mode === "register" ? "Minimal 8 karakter" : "Kata sandi"
                    }
                  />
                </label>
                {mode === "register" && (
                  <div className="auth-field-row">
                    <label className="auth-field">
                      Jenjang
                      <select name="grade" defaultValue="Kelas 12">
                        <option>Kelas 12</option>
                        <option>Kelas 11</option>
                        <option>Gap year</option>
                      </select>
                    </label>
                    <label className="auth-field">
                      Target UTBK
                      <input
                        name="goal"
                        type="number"
                        min="100"
                        max="1000"
                        defaultValue="700"
                        required
                      />
                    </label>
                  </div>
                )}
                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="auth-submit" disabled={busy}>
                  {busy
                    ? "Memproses…"
                    : mode === "login"
                      ? "Masuk"
                      : "Buat akun"}
                  <ArrowRight size={17} />
                </button>
              </form>
              <p className="auth-switch">
                {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                <Link href={mode === "login" ? "/register" : "/login"}>
                  {mode === "login" ? "Daftar gratis" : "Masuk"}
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
