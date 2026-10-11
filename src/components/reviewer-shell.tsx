"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  LogOut,
  PanelTop,
  ShieldCheck,
} from "lucide-react";

const items = [
  { href: "/reviewer", label: "Ringkasan", icon: PanelTop },
  { href: "/reviewer/queue", label: "Review soal", icon: ClipboardCheck },
  { href: "/reviewer/learning", label: "Review learning", icon: BookOpenCheck },
];

export function ReviewerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    localStorage.removeItem("levelup-attempt");
    router.replace("/?signed_out=1");
    router.refresh();
  }

  return (
    <div className="ops-shell reviewer-shell">
      {pendingHref && <div className="app-nav-progress" aria-hidden="true" />}
      <aside className="ops-sidebar">
        <Link href="/reviewer" className="ops-brand" onClick={() => setPendingHref("/reviewer")}>
          <span className="ops-brand-mark">LU</span>
          <span>
            <strong>LevelUP</strong>
            <small>Review workspace</small>
          </span>
        </Link>
        <div className="ops-role">
          <ShieldCheck size={15} /> REVIEWER
        </div>
        <nav className="ops-nav" aria-label="Reviewer navigation">
          {items.map((item) => {
            const active = pendingHref
              ? pendingHref === item.href
              : item.href === "/reviewer"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                className={active ? (pendingHref ? "active pending" : "active") : ""}
                href={item.href}
                key={item.href}
                onClick={() => setPendingHref(item.href)}
              >
                <item.icon size={17} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ops-sidebar-note">
          <CheckCircle2 size={18} />
          <p>
            Periksa akurasi, kejelasan, struktur belajar, pembahasan, taxonomy,
            dan kualitas soal sebelum konten diterbitkan.
          </p>
        </div>
        <button className="ops-logout" onClick={() => void logout()}>
          <LogOut size={16} /> Keluar
        </button>
      </aside>
      <section className="ops-workspace">
        <header className="ops-topbar">
          <div>
            <span>QUALITY CONTROL</span>
            <strong>Reviewer workspace</strong>
          </div>
          <Link href="/app" onClick={() => setPendingHref("/app")}>Lihat ruang siswa</Link>
        </header>
        <main className="ops-main">
          <div className="ops-view-transition" key={pathname}>{children}</div>
          <footer className="ops-app-footer">
            <strong>LevelUP Math · Reviewer</strong>
            <span>Quality control untuk soal dan pengalaman belajar.</span>
          </footer>
        </main>
      </section>
    </div>
  );
}
