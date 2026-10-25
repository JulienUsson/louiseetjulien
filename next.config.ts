import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 est un module natif : il doit rester externe au bundle serveur.
  serverExternalPackages: ["better-sqlite3", "nodemailer"],
  // Sur le Raspberry Pi, la vérification des types sature la mémoire ; le job
  // `check` de la CI l'a déjà faite avant tout déploiement.
  typescript: { ignoreBuildErrors: process.env.SKIP_TYPECHECK === "1" },
};

export default nextConfig;
