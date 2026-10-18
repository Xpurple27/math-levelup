import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke VECTRA Math untuk melanjutkan learning trajectory-mu.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
