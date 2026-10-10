import { adminIdentity } from "@/features/content/auth";
import { ReviewerShell } from "@/components/reviewer-shell";
import { notFound, redirect } from "next/navigation";
import { StorageError } from "@/lib/store-errors";

export const dynamic = "force-dynamic";

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const identity = await adminIdentity();
    if (identity.role === "ADMIN") redirect("/admin");
    if (identity.role !== "REVIEWER") notFound();
  } catch (e) {
    if (e instanceof StorageError && e.status === 401) redirect("/login");
    if (e instanceof StorageError && e.status === 403) notFound();
    throw e;
  }

  return <ReviewerShell>{children}</ReviewerShell>;
}
