import { adminIdentity } from "@/features/content/auth";
import { AdminShell } from "@/components/admin/shell";
import { notFound, redirect } from "next/navigation";
import { StorageError } from "@/lib/store-errors";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  let identity;
  try {
    identity = await adminIdentity();
  } catch (e) {
    if (e instanceof StorageError && e.status === 401) redirect("/login");
    if (e instanceof StorageError && e.status === 403) notFound();
    return (
      <main className="ops-setup-error">
        <h1>Content database belum tersedia</h1>
        <p>Periksa konfigurasi dan jalankan migration V2.</p>
      </main>
    );
  }

  if (identity.role === "REVIEWER") redirect("/reviewer");
  if (identity.role !== "ADMIN") notFound();

  return <AdminShell role={identity.role}>{children}</AdminShell>;
}
