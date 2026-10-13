import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { getUser } from "@/lib/store";

export default async function RegisterPage() {
  let user = null;
  try {
    user = await getUser();
  } catch {}

  if (user) redirect("/app");
  return <AuthPage mode="register" />;
}
