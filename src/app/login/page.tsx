import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { getUser } from "@/lib/store";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke VECTRA Math untuk melanjutkan learning trajectory-mu.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  let user = null;
  try {
    user = await getUser();
  } catch {}

  if (user) redirect("/app");
  return <AuthPage mode="login" />;
}
