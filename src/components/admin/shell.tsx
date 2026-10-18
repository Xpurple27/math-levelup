"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpenText, Boxes, Files, Image as ImageIcon, LayoutDashboard, LibraryBig, LogOut, MonitorUp, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    if (pathname !== "/admin/imports") return;
    const frame = window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>(".import-format-card p").forEach((node) => {
        if (node.textContent?.includes("LevelUP")) node.textContent = node.textContent.replaceAll("LevelUP", "VECTRA");
      });
      const template = document.querySelector<HTMLAnchorElement>('a[href="/templates/levelup-question-import.xlsx"]');
      if (template) template.download = "vectra-question-import.xlsx";
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

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
          <header className="ops-topbar"><div><span>AUTHORING SYSTEM</span><strong>VECTRA Content Studio</strong></div><Link href="/app" onClick={() => setPendingHref("/app")}><MonitorUp size={16} /> Lihat ruang siswa</Link></header>
          <main className="ops-main" id="content">
            <div className="ops-view-transition" key={pathname}>{children}</div>
            <footer className="ops-app-footer"><strong>VECTRA Math · Admin</strong><span>Question Bank · Learning · Assessment · Quality</span></footer>
          </main>
        </section>
        <Link href="/app" onClick={() => setPendingHref("/app")} className="fixed bottom-5 right-5 z-[80] flex min-h-12 items-center gap-2 rounded-full bg-[#0b1020] px-4 py-3 text-sm font-extrabold text-white shadow-xl md:hidden" aria-label="Lihat ruang siswa">
          <MonitorUp size={17} /> Ruang siswa
        </Link>
      </div>
    </AdminRole.Provider>
  );
}
