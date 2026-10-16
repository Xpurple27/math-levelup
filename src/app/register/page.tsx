import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { getUser } from "@/lib/store";

export const metadata: Metadata = {
  title: "Mulai",
  description: "Mulai VECTRA Diagnostic dan bangun learning profile-mu.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  let user = null;
  try {
    user = await getUser();
  } catch {}

  if (user) redirect("/app");
  return <AuthPage mode="register" />;
}
