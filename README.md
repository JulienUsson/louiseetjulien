# Louise & Julien

Le site du mariage de Louise & Julien : la page « Save the Date », les pages
personnelles des invités et le back-office qui sert à les gérer.

Next.js 16 (App Router) · Prisma 7 · SQLite · shadcn/ui · Tailwind v4.

Deux faces :

- **Côté invité** — une page publique « Save the Date », et une page privée par
  invité accessible via un lien contenant un code aléatoire (`/i/<code>`).
  Pas de compte, pas de mot de passe : le lien fait office d'identification.
  L'invité y renseigne lui-même son email, confirme sa présence, déclare ses
  accompagnants et ses allergies.
- **Côté mariés** — un back-office (`/admin`) protégé par un mot de passe unique
  pour créer les invités, générer et envoyer les liens, publier des
  informations et suivre les réponses.

## Démarrage

```bash
pnpm install
cp .env.example .env       # puis renseignez ADMIN_PASSWORD et SESSION_SECRET
pnpm db:migrate            # crée la base SQLite et applique les migrations
pnpm db:seed               # facultatif : jeu de données de démonstration
pnpm dev
```

L'application écoute sur <http://localhost:3000>, le back-office sur
<http://localhost:3000/admin>.

## Scripts

| Script            | Rôle                                                   |
| ----------------- | ------------------------------------------------------ |
| `pnpm dev`        | Serveur de développement                               |
| `pnpm build`      | `prisma generate` puis build de production              |
| `pnpm start`      | Démarre le build de production                         |
| `pnpm lint`       | ESLint                                                 |
| `pnpm db:migrate` | Crée et applique une migration (développement)         |
| `pnpm db:deploy`  | Applique les migrations existantes (production)        |
| `pnpm db:studio`  | Explorateur de base Prisma Studio                      |
| `pnpm db:seed`    | Insère des données de démonstration                    |

## Les deux types d'invités

| Type       | Libellé            | Voit                                              |
| ---------- | ------------------ | ------------------------------------------------- |
| `FULL`     | Journée complète   | Cérémonie, vin d'honneur, dîner et soirée         |
| `COCKTAIL` | Vin d'honneur      | Cérémonie et vin d'honneur                        |

Chaque information publiée cible une audience (`ALL`, `FULL` ou `COCKTAIL`) :
elle n'apparaît que sur la page des invités concernés, et la diffusion par
email suit la même règle.

## Créer les invités

Trois façons, toutes dans `/admin/invites` :

1. **Un par un** — bouton « Ajouter un invité ». L'email est facultatif.
2. **En masse** — bouton « Importer une liste », une ligne par invité :
   `Prénom;Nom;FULL ou COCKTAIL;accompagnants;email`. Seuls le prénom et le nom
   sont obligatoires ; les séparateurs `;`, `,` et tabulation sont acceptés, ce
   qui permet de coller directement depuis un tableur.
3. **Envoi groupé** — bouton « Envoyer les invitations en attente » : écrit à
   tous les invités qui ont un email et n'ont jamais reçu leur lien.

Chaque invitation reçoit un code de 10 caractères tiré au sort dans un alphabet
sans caractères ambigus (pas de `0`/`O`, ni de `1`/`I`/`L`), pour rester
recopiable à la main depuis un carton papier ou un SMS.

Le bouton « Régénérer le lien » d'une fiche invité invalide immédiatement
l'ancien lien — utile si un code a circulé par erreur.

## Emails

L'envoi est actif dès que `SMTP_HOST` est renseigné. Sans configuration SMTP,
l'application fonctionne normalement mais aucun email ne part : chaque
tentative est journalisée dans `/admin/emails` avec sa raison d'échec.

Trois types d'envois : le lien d'invitation (individuel ou groupé), la
diffusion d'une information publiée, et un email de test pour valider la
configuration avant la première vraie campagne.

## Déploiement on-premise

L'application tourne en Node derrière un reverse proxy (nginx, Caddy…), avec
la base SQLite sur un disque persistant.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm db:deploy          # applique les migrations sur la base de production
pnpm start              # écoute sur le port 3000, surchargeable avec PORT
```

Variables d'environnement : voir `.env.example`. En production, `APP_URL` doit
contenir l'URL publique du site (sinon les liens envoyés par email pointent
vers `localhost`), et `SESSION_SECRET` est obligatoire.

### Exemple d'unité systemd

```ini
[Unit]
Description=Site de mariage Louise & Julien
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/louiseetjulien
EnvironmentFile=/srv/louiseetjulien/.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Sauvegarde

Toutes les données tiennent dans le fichier SQLite désigné par `DATABASE_URL`.
Sauvegardez-le à chaud sans arrêter l'application :

```bash
sqlite3 /var/lib/louiseetjulien/wedding.db ".backup '/sauvegardes/wedding-$(date +%F).db'"
```

## Modèle de données

- `Guest` — un invité = une invitation = un lien. Porte le code, le type,
  l'email (renseigné par l'invité), la réponse et le nombre d'accompagnants
  autorisés.
- `Companion` — les accompagnants déclarés par l'invité.
- `InfoPost` — une information, son audience et son état de publication.
- `EmailLog` — la trace de chaque envoi, réussi ou non.
- `Setting` — les réglages de l'évènement (dates, lieux, contacts), éditables
  depuis `/admin/reglages`.

SQLite ne gérant pas les enums Prisma, les champs « énumérés » sont des `String`
validés côté application (`src/lib/constants.ts`).

L'ancienne SPA Vite et le déploiement Netlify ont été remplacés par cette
application, hébergée sur un serveur on-premise. Le carton « Save the Date » et
son enveloppe animée y ont été repris à l'identique.
