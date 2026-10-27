"use client";
import { useState } from "react";
import type { User } from "./types";

export function ProfileView({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: (user: User) => void;
}) {
  const [name, setName] = useState(user.name),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateProfile", name }),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error || "Profil gagal diperbarui.");
      onUpdated(d.user);
      setName(d.user.name);
      setMessage("Nama berhasil diperbarui.");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Profil gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="student-section profile-view">
      <div className="student-section-heading">
        <span>VECTRA PROFILE</span>
        <h1>Profil saya</h1>
        <p>
          Identitas ini digunakan pada ruang belajar dan learning profile
          VECTRA.
        </p>
      </div>
      <form className="profile-card" onSubmit={save}>
        <label>
          Nama
          <input
            value={name}
            minLength={2}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Email
          <input value={user.email} disabled />
        </label>
        <div className="profile-meta">
          <span>{user.grade}</span>
          <span>Target {user.goal}</span>
        </div>
        {error && (
          <p role="alert" className="profile-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="profile-success">
            {message}
          </p>
        )}
        <button
          className="student-primary-action"
          disabled={busy || name.trim() === user.name}
        >
          {busy ? "Menyimpan…" : "Simpan nama"}
        </button>
      </form>
    </section>
  );
}
