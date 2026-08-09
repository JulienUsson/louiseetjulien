# Louise & Julien

Le site du mariage de Louise & Julien : la page « Save the Date », les pages
personnelles des invités et le back-office qui sert à les gérer.

```
packages/
  app/    application Next.js — voir packages/app/README.md
```

## Démarrage rapide

```bash
cd packages/app
pnpm install
cp .env.example .env       # renseignez ADMIN_PASSWORD et SESSION_SECRET
pnpm db:migrate
pnpm dev
```

L'ancienne SPA Vite (`packages/frontend`) et le déploiement Netlify ont été
remplacés par cette application, hébergée sur un serveur on-premise. Le carton
« Save the Date » et son enveloppe animée y ont été repris à l'identique.
