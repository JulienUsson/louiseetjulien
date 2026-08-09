"use server";

import { redirect } from "next/navigation";

import { checkPassword, createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  let valid: boolean;
  try {
    valid = checkPassword(password);
  } catch (error) {
    // ADMIN_PASSWORD absent : on le dit clairement plutôt que « mot de passe
    // incorrect », sinon le déploiement est indébogable.
    return {
      error: error instanceof Error ? error.message : "Configuration invalide.",
    };
  }

  if (!valid) return { error: "Mot de passe incorrect." };

  await createSession();
  // `redirect` lève une exception de contrôle : elle doit rester hors du try.
  redirect("/admin");
}
