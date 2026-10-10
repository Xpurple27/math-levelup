"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCheck,
  LogOut,
  PanelTop,
  ShieldCheck,
} from "lucide-react";

const items = [
  { href: "/reviewer", label: "Ringkasan", icon: PanelTop },
  { href: "/reviewer/queue", label: "Review queue", icon: ClipboardCheck },
];

export function ReviewerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
      <aside className="ops-sidebar">
        <Link href="/reviewer" className="ops-brand">
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
            const active =
              item.href === "/reviewer"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                className={active ? "active" : ""}
                href={item.href}
                key={item.href}
              >
                <item.icon size={17} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ops-sidebar-note">
          <CheckCircle2 size={18} />
          <p>
            Fokus reviewer: akurasi matematika, kejelasan bahasa, taxonomy,
            pembahasan, dan kualitas distraktor.
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
          <Link href="/app">Lihat ruang siswa</Link>
        </header>
        <main className="ops-main">{children}</main>
      </section>
    </div>
  );
}
