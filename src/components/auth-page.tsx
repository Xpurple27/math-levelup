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
