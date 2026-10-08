"use client";
import { ArrowRight, GraduationCap, X } from "lucide-react";
import type { Auth, ActionReply } from "./types";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  setAuth: Dispatch<
    SetStateAction<"login" | "register" | "confirmation" | null>
  >;
  setError: Dispatch<SetStateAction<string>>;
  auth: Exclude<Auth, null>;
  notice: string;
  call: (data: Record<string, unknown>) => Promise<ActionReply | null>;
  setNotice: Dispatch<SetStateAction<string>>;
  refresh: () => Promise<void>;
  error: string;
  busy: boolean;
  backend: "local" | "supabase";
};
export function AuthDialog({
  setAuth,
  setError,
  auth,
  notice,
  call,
  setNotice,
  refresh,
  error,
  busy,
  backend,
}: Props) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          className="modal-close icon-button"
          aria-label="Tutup"
          onClick={() => {
            setAuth(null);
            setError("");
          }}
        >
          <X size={20} />
        </button>
        <span className="icon-tile purple">
          <GraduationCap size={26} />
        </span>
        <h2 id="auth-title">
          {auth === "register"
            ? "Mulai perjalananmu."
            : auth === "confirmation"
              ? "Konfirmasi email terlebih dahulu"
              : "Selamat datang kembali."}
        </h2>
        <p className="muted">
          {notice || "Simpan progres dan temukan langkah belajar yang tepat."}
        </p>
        {auth === "confirmation" ? (
          <div>
            <p>
              Akun berhasil dibuat. Kami mengirim tautan verifikasi ke emailmu.
              Konfirmasi email tersebut lalu kembali ke LevelUP Math untuk mulai
              diagnostik.
            </p>
            <ol>
              <li>Buka email dari Supabase, termasuk folder spam.</li>
              <li>Klik tautan konfirmasi email.</li>
              <li>Kembali ke aplikasi dan masuk dengan akun Anda.</li>
            </ol>
            <button
              className="button primary full"
              onClick={() => {
                setAuth("login");
                setError("");
              }}
            >
              Sudah konfirmasi? Masuk
            </button>
          </div>
        ) : (
          <>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                const d = await call({ action: auth, ...data });
                if (d) {
                  if (d.confirmationRequired) {
                    sessionStorage.setItem(
                      "levelup-email-confirmation",
                      "pending",
                    );
                    setAuth("confirmation");
                    setNotice(
                      "Pendaftaran diterima. Anda belum masuk; konfirmasi email diperlukan sebelum latihan.",
                    );
                  } else {
                    sessionStorage.removeItem("levelup-email-confirmation");
                    setAuth(null);
                    setNotice("");
                  }
                  await refresh();
                }
              }}
            >
              {auth === "register" && (
                <label className="field">
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
              <label className="field">
                Email
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="kamu@email.com"
                />
              </label>
              <label className="field">
                Kata sandi
                <input
                  name="password"
                  required
                  type="password"
                  minLength={auth === "register" ? 8 : 1}
                  maxLength={200}
                  autoComplete={
                    auth === "register" ? "new-password" : "current-password"
                  }
                  placeholder="Minimal 8 karakter"
                />
              </label>
              {auth === "register" && (
                <div className="form-row">
                  <label className="field">
                    Jenjang
                    <select name="grade">
                      <option>Kelas 12</option>
                      <option>Kelas 11</option>
                      <option>Gap year</option>
                    </select>
                  </label>
                  <label className="field">
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
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary full" disabled={busy}>
                {busy
                  ? "Memproses…"
                  : auth === "register"
                    ? "Buat akun"
                    : "Masuk"}
                <ArrowRight size={17} />
              </button>
            </form>
            <button
              className="text-button auth-toggle"
              onClick={() => {
                setAuth(auth === "register" ? "login" : "register");
                setError("");
              }}
            >
              {auth === "register"
                ? "Sudah punya akun? Masuk"
                : "Belum punya akun? Daftar gratis"}
            </button>
          </>
        )}
        <div className="demo-label">
          {backend === "supabase"
            ? "Akun online dikelola melalui Supabase."
            : "Versi pengembangan · akun tersimpan lokal di server ini."}
          <br />
          {backend === "supabase"
            ? "Jika diminta, konfirmasikan email sebelum masuk."
            : "Gunakan kata sandi khusus untuk mencoba aplikasi."}
        </div>
      </section>
    </div>
  );
}
