"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpenText, Boxes, Files, Image as ImageIcon, LayoutDashboard, LibraryBig, LogOut, ShieldCheck } from "lucide-react";
import type { Role } from "@/features/content/model";
import { VectraMark } from "../vectra-brand";

const AdminRole = createContext<Role>("STUDENT");
export function useAdminRole() { return useContext(AdminRole); }

const sections = [
  { label: "CONTENT", items: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/questions", label: "Question Bank", icon: LibraryBig },
    { href: "/admin/imports", label: "Imports", icon: Files },
    { href: "/admin/media", label: "Media", icon: ImageIcon },
  ]},
  { label: "LEARNING", items: [{ href: "/admin/learning", label: "Learning Builder", icon: BookOpenText }]},
  { label: "ASSESSMENT", items: [{ href: "/admin/practice-packages", label: "Practice Packages", icon: Boxes }]},
  { label: "QUALITY", items: [{ href: "/admin/qa", label: "QA Queue", icon: ShieldCheck }]},
] as const;

export function AdminShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    localStorage.removeItem("levelup-attempt");
    router.replace("/?signed_out=1");
    router.refresh();
  }

  function activeFor(href: string) {
    const target = pendingHref || pathname;
    return href === "/admin" ? target === href : target.startsWith(href);
  }

  return (
    <AdminRole.Provider value={role}>
      <div className="ops-shell admin-studio-shell admin-shell">
        {pendingHref && <div className="app-nav-progress" aria-hidden="true" />}
        <aside className="ops-sidebar">
          <Link className="ops-brand" href="/admin" onClick={() => setPendingHref("/admin")}>
            <span className="ops-brand-mark"><VectraMark size={28} /></span>
            <span><strong>VECTRA</strong><small>Content studio</small></span>
          </Link>
          <div className="ops-role"><ShieldCheck size={15} /> ADMIN</div>
          {sections.map((section) => (
            <div className="ops-nav-section" key={section.label}>
              <div className="ops-nav-label">{section.label}</div>
              <nav className="ops-nav" aria-label={`${section.label} navigation`}>
                {section.items.map((item) => {
                  const active = activeFor(item.href);
                  return <Link key={item.href} href={item.href} onClick={() => setPendingHref(item.href)} className={active ? (pendingHref ? "active pending" : "active") : ""}><item.icon size={17} /> {item.label}</Link>;
                })}
              </nav>
            </div>
          ))}
          <div className="ops-sidebar-note"><span className="ops-note-kicker">WORKFLOW</span><p>Question Bank menyimpan soal. Learning Builder menyusun materi. Practice Packages merakit soal published menjadi pengalaman practice siswa.</p></div>
          <button className="ops-logout" onClick={() => void logout()}><LogOut size={16} /> Keluar</button>
        </aside>
        <section className="ops-workspace">
          <header className="ops-topbar"><div><span>AUTHORING SYSTEM</span><strong>VECTRA Content Studio</strong></div><Link href="/app" onClick={() => setPendingHref("/app")}>Lihat ruang siswa</Link></header>
          <main className="ops-main" id="content">
            <div className="ops-view-transition" key={pathname}>{children}</div>
            <footer className="ops-app-footer"><strong>VECTRA Math · Admin</strong><span>Question Bank · Learning · Assessment · Quality</span></footer>
          </main>
        </section>
      </div>
    </AdminRole.Provider>
  );
}
