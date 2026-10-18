import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mulai",
  description: "Mulai VECTRA Diagnostic dan bangun learning profile-mu.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
