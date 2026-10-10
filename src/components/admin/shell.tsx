"use client";

import Link from "next/link";
import { createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Files,
  Image as ImageIcon,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { Role } from "@/features/content/model";

const AdminRole = createContext<Role>("STUDENT");

export function useAdminRole() {
  return useContext(AdminRole);
}

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Question Bank", icon: LibraryBig },
  { href: "/admin/imports", label: "Imports", icon: Files },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/qa", label: "QA Queue", icon: ShieldCheck },
];

export function AdminShell({ role, children }: { role: Role; children: React.ReactNode }) {
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
    <AdminRole.Provider value={role}>
      <div className="ops-shell admin-studio-shell">
        <aside className="ops-sidebar">
          <Link className="ops-brand" href="/admin">
            <span className="ops-brand-mark">LU</span>
            <span><strong>LevelUP</strong><small>Content studio</small></span>
          </Link>
          <div className="ops-role"><ShieldCheck size={15} /> ADMIN</div>
          <div className="ops-nav-label">CONTENT</div>
          <nav className="ops-nav" aria-label="Admin navigation">
            {nav.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                  <item.icon size={17} /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ops-sidebar-note">
            <span className="ops-note-kicker">WORKFLOW</span>
            <p>Draft → Review → QA Passed → Publish. Konten production dimulai dari nol dan hanya diisi hasil kurasi.</p>
          </div>
          <button className="ops-logout" onClick={() => void logout()}><LogOut size={16} /> Keluar</button>
        </aside>
        <section className="ops-workspace">
          <header className="ops-topbar">
            <div><span>AUTHORING SYSTEM</span><strong>LevelUP Content Studio</strong></div>
            <Link href="/app">Lihat ruang siswa</Link>
          </header>
          <main className="ops-main">{children}</main>
        </section>
      </div>
    </AdminRole.Provider>
  );
}
