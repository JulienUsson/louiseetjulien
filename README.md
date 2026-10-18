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

| Type       | Libellé            | Voit                                               |
| ---------- | ------------------ | -------------------------------------------------- |
| `FULL`     | Journée complète   | Cérémonie laïque, vin d'honneur, dîner et soirée   |
| `COCKTAIL` | Vin d'honneur      | Cérémonie laïque et vin d'honneur                  |

La formule n'est jamais affichée à l'invité comme une étiquette : elle est dite
en toutes lettres dans la description du jour J, pour que les invités au vin
d'honneur sachent à quoi ils sont conviés sans se voir coller un tampon.

Chaque information publiée cible une audience (`ALL`, `FULL` ou `COCKTAIL`) :
elle n'apparaît que sur la page des invités concernés, et la diffusion par
email suit la même règle.

## La journée et ses lieux

Trois lieux, configurés dans `/admin/reglages` : la **mairie**, la **cérémonie
laïque** et la **réception**. Il n'y a pas de cérémonie religieuse.

Le passage en mairie étant plus intime, chaque invité indique séparément s'il
souhaite y assister — la question n'apparaît que si un lieu de mairie est
renseigné, et seulement pour ceux qui viennent. Le tableau de bord en donne
l'effectif, accompagnants compris.

Chaque lieu accepte des coordonnées `latitude,longitude` qui déclenchent
l'affichage d'une carte OpenStreetMap sur la page des invités. Le bouton
« Localiser l'adresse » les remplit via Nominatim ; les coordonnées sont
stockées en base, aucun appel externe n'a lieu au rendu des pages invité. Sans
coordonnées, seule l'adresse en texte est affichée.

## Le ton

Les invités sont tutoyés, partout : pages, formulaire de réponse, emails. Le
back-office, lui, s'adresse aux mariés.

## Créer les invités

Deux façons, toutes deux dans `/admin/invites` :

1. **Un par un** — bouton « Ajouter un invité ». L'email est facultatif.
2. **En masse** — bouton « Importer une liste », une ligne par invité :
   `Prénom;Nom;FULL ou COCKTAIL;accompagnants;email`. Seuls le prénom et le nom
   sont obligatoires ; les séparateurs `;`, `,` et tabulation sont acceptés, ce
   qui permet de coller directement depuis un tableur.

Les deux proposent d'**envoyer l'invitation dans la foulée**, si une adresse
email est renseignée. La case est cochée par défaut à la création, décochée à
l'import — coller cent lignes ne doit pas déclencher cent envois par
inadvertance. Si l'envoi échoue, l'invité est créé quand même et l'erreur est
affichée : une panne SMTP ne fait pas perdre la saisie.

## Transmettre son lien à un invité

Chaque ligne de la liste offre quatre actions :

| Action              | Usage                                                     |
| ------------------- | --------------------------------------------------------- |
| **Lien**            | Copie l'URL seule                                          |
| **Message**         | Copie une invitation complète, prête à coller en SMS       |
| **Prévisualiser**   | Ouvre la page telle que l'invité la voit                    |
| **Fiche**           | Ouvre la fiche d'administration                             |

« Message » est le chemin principal au démarrage : comme ce sont les invités
qui renseignent leur email depuis leur lien, presque personne n'en a en base au
début, et l'envoi par email ne peut atteindre qu'une poignée de gens.

Depuis la fiche d'un invité, « Envoyer par email » (re)transmet le lien dès
qu'une adresse est connue — utile pour ceux créés sans email.

Chaque invitation reçoit un code de 10 caractères tiré au sort dans un alphabet
sans caractères ambigus (pas de `0`/`O`, ni de `1`/`I`/`L`), pour rester
recopiable à la main depuis un carton papier ou un SMS.

Le bouton « Régénérer le lien » d'une fiche invité invalide immédiatement
l'ancien lien — utile si un code a circulé par erreur.

## Emails

L'envoi est actif dès que `SMTP_HOST` est renseigné. Sans configuration SMTP,
l'application fonctionne normalement mais aucun email ne part : chaque
tentative est journalisée dans `/admin/emails` avec sa raison d'échec.

Quatre types d'envois : le lien d'invitation (à la création de l'invité, à
l'import, ou depuis sa fiche), la diffusion d'une information publiée, un
message libre ciblé, et un email de test pour valider la configuration avant la
première vraie campagne.

Le message libre se compose depuis `/admin/emails` et se cible par formule et
par état de réponse — pour relancer les silencieux, ou n'écrire qu'aux
présents. Le nombre de destinataires se met à jour à mesure que vous cochez, et
signale les invités qui correspondent aux filtres mais n'ont pas encore
renseigné leur email.

## Déploiement on-premise

L'application tourne en Node derrière un reverse proxy (nginx, Caddy…), avec
la base SQLite sur un disque persistant.

```bash
pnpm install --frozen-lockfile --prod=false
pnpm build
pnpm db:deploy          # applique les migrations sur la base de production
pnpm start              # écoute sur le port 3000, surchargeable avec PORT
```

`--prod=false` n'est pas décoratif : pnpm n'installe pas les
`devDependencies` quand `NODE_ENV=production`, or le build en a besoin — la
CLI Prisma (appelée par le `postinstall`), TypeScript et Tailwind y sont.
Sans ce drapeau, l'installation échoue dès le `postinstall`.

### Variables d'environnement

Deux façons de les fournir, selon comment vous déployez.

- **Sous devenv** — les profils `dev` et `production` de `devenv.nix` les
  exportent, les secrets de production venant de secretspec
  (`secretspec.toml`). C'est la voie normale : entrez dans le shell avec
  `devenv shell --profile production`. Le fichier `.env` n'a alors aucun
  effet, `dotenv` n'écrasant jamais une variable déjà définie.
- **Sans devenv** — copiez `.env.example` en `.env` et renseignez-le.

Dans les deux cas, `APP_URL` doit contenir l'URL publique du site (sinon les
liens envoyés par email pointent vers `localhost`) et `SESSION_SECRET` est
obligatoire : sans lui, l'application refuse de créer une session en
production.

### Exemple d'unité systemd

```ini
[Unit]
Description=Site de mariage Louise & Julien
After=network.target

[Service]
Type=simple
User=louiseetjulien
WorkingDirectory=/srv/louiseetjulien
EnvironmentFile=/srv/louiseetjulien/.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Livraison continue

`.github/workflows/deploy.yml` tourne à chaque push et pull request :

1. **check** — lint et build sur un runner GitHub, pour ne jamais livrer un
   commit qui ne compile pas.
2. **deploy** — sur `master` uniquement, une fois `check` au vert : un runner
   GitHub **auto-hébergé sur le Raspberry Pi** exécute `deploy/deploy.sh`.

Le runner tourne sur le Pi lui-même : il va chercher le travail chez GitHub,
aucun port n'est à ouvrir et aucune clé SSH ne transite par GitHub. Le build se
fait aussi sur le Pi, avec son Node : `better-sqlite3` est un module natif, il
doit être compilé pour l'architecture et la version de Node qui l'exécutent.

`deploy/deploy.sh` construit le site dans l'espace de travail du runner, le
recopie dans `/srv/louiseetjulien` (sans toucher à `.env` ni aux bases),
applique les migrations, puis redémarre le service. Le site reste en ligne
pendant le build ; seul le redémarrage final coupe quelques secondes.
`APP_DIR` et `SERVICE` surchargent le dossier et le nom du service.

Mise en place, une fois, sur le Pi :

```bash
sudo apt install rsync sqlite3
sudo useradd --system --create-home --shell /bin/bash louiseetjulien
sudo mkdir -p /srv/louiseetjulien && sudo chown louiseetjulien: /srv /srv/louiseetjulien
# .env de production dans /srv/louiseetjulien/.env, avec DATABASE_URL=file:../mariage.db
# unité systemd ci-dessus dans /etc/systemd/system/louiseetjulien.service
sudo systemctl enable louiseetjulien
echo 'louiseetjulien ALL=(root) NOPASSWD: /usr/bin/systemctl restart louiseetjulien' \
  | sudo tee /etc/sudoers.d/louiseetjulien
```

Node 22 et pnpm doivent être installés pour tout le système (`/usr/bin/node`,
`/usr/bin/pnpm`) : le runner et le service doivent utiliser le même Node.

Puis le runner : sur GitHub, *Settings → Actions → Runners → New self-hosted
runner*, choisir *Linux / ARM64*, et suivre les commandes affichées **en tant
qu'utilisateur `louiseetjulien`**, en ajoutant le label `louiseetjulien` quand
`config.sh` le demande. L'installer ensuite comme service pour qu'il survive aux
redémarrages :

```bash
sudo ./svc.sh install louiseetjulien && sudo ./svc.sh start
```

Le dépôt étant public, une pull request venue d'un fork peut modifier le
workflow et viser le runner du Pi. Dans *Settings → Actions → General*, cochez
*Require approval for all external contributors*.

Un déploiement se relance à la main depuis l'onglet *Actions* (« Run
workflow »).

### Sauvegarde

Toutes les données tiennent dans le fichier SQLite désigné par `DATABASE_URL`.
`deploy/backup.sh` en fait une copie à chaud (sans arrêter l'application),
vérifie son intégrité, la compresse et l'envoie sur Google Drive avec
[rclone](https://rclone.org). Les copies de plus de 30 jours sont supprimées du
Drive.

| Variable    | Défaut                  | Rôle                                  |
| ----------- | ----------------------- | ------------------------------------- |
| `DB_PATH`   | —                       | Chemin de la base SQLite              |
| `REMOTE`    | `gdrive:louiseetjulien` | Remote rclone et dossier de destination |
| `KEEP_DAYS` | `30`                    | Durée de conservation sur le Drive    |

Un timer systemd la déclenche chaque nuit vers 3 h ; si le Pi était éteint à
cette heure-là, elle part à son redémarrage.

Mise en place, une fois, sur le Pi :

1. Installer rclone (`sudo apt install rclone`) et, **en tant qu'utilisateur
   `louiseetjulien`**, lancer `rclone config` : nouveau remote nommé `gdrive`,
   type `drive`, scope `drive.file` (rclone ne voit que les fichiers qu'il a
   créés). Le Pi n'ayant pas de navigateur, répondre *No* à « Use web
   browser » et exécuter la commande `rclone authorize "drive" ...` proposée
   sur un ordinateur qui en a un, puis recoller le jeton obtenu.
2. Tester : `DB_PATH=/srv/mariage.db /srv/louiseetjulien/deploy/backup.sh`, et
   vérifier l'apparition du dossier `louiseetjulien` dans le Drive.
3. Activer le timer :

   ```bash
   sudo cp /srv/louiseetjulien/deploy/louiseetjulien-backup.{service,timer} /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now louiseetjulien-backup.timer
   ```

`systemctl list-timers` affiche la prochaine exécution,
`journalctl -u louiseetjulien-backup` le résultat des précédentes.

Pour restaurer : arrêter le service, décompresser une copie
(`gunzip mariage-AAAA-MM-JJ.db.gz`) à la place de `/srv/mariage.db`, redémarrer.

## Modèle de données

- `Guest` — un invité = une invitation = un lien. Porte le code, le type,
  l'email (renseigné par l'invité), la réponse, la présence à la mairie et le
  nombre d'accompagnants autorisés.
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
