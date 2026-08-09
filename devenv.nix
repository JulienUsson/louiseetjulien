{
  pkgs,
  lib,
  config,
  inputs,
  ...
}: {
  packages = with pkgs; [alejandra git pnpm nodejs_22 secretspec sqlite];

  profiles = {
    dev.module = {
      env = {
        DATABASE_URL = "file:./dev.db";
        APP_URL = "http://localhost:3000";
        ADMIN_PASSWORD = "admin";
        # Valeur fixe et non secrète : sans elle l'app tire un secret au
        # hasard à chaque démarrage, ce qui déconnecte le back-office.
        SESSION_SECRET = "dev-only-session-secret-0123456789";
      };
    };
    production.module = {
      env = {
        SECRETSPEC_PROFILE = "production";
        APP_URL = "https://louiseetjulien.fr";
        ADMIN_PASSWORD = config.secretspec.secrets.ADMIN_PASSWORD;
        SESSION_SECRET = config.secretspec.secrets.SESSION_SECRET;
        DATABASE_URL = "file:../mariage.db";
        NODE_ENV = "production";
        SMTP_HOST = "smtp.tem.scaleway.com";
        SMTP_PORT = "465";
        SMTP_SECURE = "true";
        SMTP_USER = config.secretspec.secrets.SMTP_USER;
        SMTP_PASSWORD = config.secretspec.secrets.SMTP_PASSWORD;
        SMTP_FROM = "noreply@louiseetjulien.fr";
      };
    };
  };
}
