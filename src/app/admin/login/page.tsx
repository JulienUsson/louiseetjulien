import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Connexion — Back-office" };

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="bg-wedding min-h-screen flex items-center justify-center px-4">
      <LoginForm />
    </main>
  );
}
