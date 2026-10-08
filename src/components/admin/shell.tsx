"use client";
import Link from "next/link";
import { createContext, useContext } from "react";
import type { Role } from "@/features/content/model";
const AdminRole = createContext<Role>("STUDENT");
export function useAdminRole() {
  return useContext(AdminRole);
}
export function AdminShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <AdminRole.Provider value={role}>
      <div className="admin-shell">
        <header>
          <Link href="/admin">LevelUP · Content Admin</Link>
          <span>{role}</span>
          <Link href="/">Ruang siswa</Link>
        </header>
        <nav>
          <Link href="/admin/questions">Question Bank</Link>
          <Link href="/admin/qa">QA Queue</Link>
          {role === "ADMIN" && (
            <>
              <Link href="/admin/imports">Excel Import</Link>
              <Link href="/admin/media">Media references</Link>
            </>
          )}
        </nav>
        <main>{children}</main>
      </div>
    </AdminRole.Provider>
  );
}
