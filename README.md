# 🎁 BloumeChat Giveaways Bot

Un bot de concours (giveaway) complet et prêt pour la production pour **BloumeChat**, avec persistance des données et configuration flexible par serveur.

## 🔗 Liens Utiles
- **Site Officiel** : [bloumechat.com](https://bloumechat.com)
- **Portail Développeur** : [bloumechat.com/developers](https://bloumechat.com/developers)
- **Documentation de l'API / SDK** : [dev.bloume.chat](https://dev.bloume.chat)
- **SDK Bot Starter (GitHub)** : [BloumeChat Bot Starter](https://github.com/BloumeSAS/bloumechat-bot-starter)

---

## 🚀 Fonctionnalités
- 🎉 **Création de concours** : Lancez des concours avec une durée personnalisée, un nombre de gagnants et un lot.
- ⏱️ **Détection automatique** : Gère automatiquement la fin des concours et sélectionne les gagnants de façon aléatoire.
- 🔁 **Relance (Reroll)** : Tirez un nouveau gagnant pour un concours déjà terminé si le gagnant d'origine ne se manifeste pas.
- 📁 **Persistance des données** : Conserve l'état des concours actifs et des configurations même après un redémarrage du bot.
- ⚙️ **Configuration modulaire** : Configuration par serveur de l'apparence des embeds, du salon cible des concours, et des permissions administratives.
- 🐳 **Prêt pour Docker & Coolify** : Livré avec un `Dockerfile` optimisé et un `docker-compose.yml`.

---

## 🛠️ Commandes

### 📢 Commandes Publiques
- `!help` : Affiche le menu d'aide du bot.
- `!glist` : Affiche la liste de tous les concours en cours d'exécution.
- `!invite` : Affiche le lien d'invitation du bot pour l'ajouter à d'autres serveurs.

### 🛡️ Commandes d'Administration
*Ces commandes requièrent les droits de propriétaire du serveur, la permission `MANAGE_SERVER` par défaut, ou le rôle défini via la configuration `adminPermission`.*

- `!gstart <temps> <gagnants> <lot>` : Démarre un nouveau concours.
  - *Format du temps* : `m` (minutes), `h` (heures), `d` (jours). Ex: `10m`, `2h`, `1d`.
  - *Exemple* : `!gstart 30m 2 Un abonnement Premium`
- `!gend [index/messageId]` : Termine immédiatement un concours et effectue le tirage au sort.
  - *Astuce* : Si aucun argument n'est fourni, cela ferme le dernier concours actif lancé. Sinon, utilisez l'index fourni par `!glist` (ex: `!gend 1`).
- `!greroll [index/messageId]` : Sélectionne de nouveaux gagnants pour un concours terminé.
  - *Astuce* : Si aucun argument n'est fourni, relance le dernier concours terminé.

---

## ⚙️ Configuration & Persistance

Toutes les données du bot (configurations de serveurs et base de données des concours) sont centralisées dans le dossier `data/` à la racine du projet.

### 1. Variables d'environnement (`.env`)
Créez un fichier `.env` (en copiant `.env.sample`) à la racine du projet :

```env
# Token de connexion de votre bot BloumeChat
BOT_TOKEN=votre_token_ici

# Préfixe par défaut pour l'ensemble des commandes du bot
PREFIX=!

# (Optionnel) ID Client de l'application
CLIENT_ID=
```

### 2. Configuration par fichier JSON (`data/`)
Le dossier `data/` contient les fichiers de configuration suivants :
- `data/default.json` : Fichier de configuration par défaut appliqué à tous les serveurs (hors concours).
- `data/<serverId>.json` : Contient la configuration spécifique d'un serveur (généré automatiquement) ainsi que la liste complète de ses concours (actifs et passés) dans un tableau `"giveaways"`.

#### Paramètres de configuration disponibles dans les fichiers JSON :
```json
{
  "footer": "Giveaways Bot • Fait avec ❤️",
  "themeColor": "#bd5fff",
  "adminPermission": "none",
  "giveawayChannel": null
}
```

| Clé | Description | Valeurs possibles |
| :--- | :--- | :--- |
| `footer` | Le texte affiché en bas de chaque message/embed envoyé par le bot. | Chaîne de caractères |
| `themeColor` | Couleur hexadécimale de la barre latérale des embeds. | Ex: `"#bd5fff"` |
| `adminPermission` | Restreint l'usage des commandes d'administration à une permission spécifique. | `'none'` (défaut, demande `MANAGE_SERVER`), `'ADMINISTRATOR'`, `'MANAGE_ROLES'`, `'MANAGE_CHANNELS'`, `'MANAGE_MESSAGES'`, `'KICK_MEMBERS'`, `'BAN_MEMBERS'`, etc. |
| `giveawayChannel` | ID du salon unique dans lequel tous les concours doivent être envoyés. | ID du salon (chaîne) ou `null` (les concours seront lancés dans le salon où la commande a été tapée). |

---

## 💻 Lancement Local

### Option 1 : Avec Node.js (npm)
1. Installez les dépendances :
   ```bash
   npm install
   ```
2. Configurez votre fichier `.env`.
3. Lancez le bot :
   ```bash
   npm start
   ```

### Option 2 : Avec Docker Compose (Recommandé)
Pour tester le comportement conteneurisé et valider la persistance :
```bash
docker compose up --build
```
Les configurations et données seront persistées localement dans le dossier `./data/` grâce au montage du volume.

---

## 🚀 Déploiement sur Coolify

Coolify permet de déployer très facilement cette application Node.js. Suivez ces étapes pour configurer le déploiement :

### Étape 1 : Créer une Nouvelle Ressource
1. Dans votre tableau de bord Coolify, rendez-vous dans votre projet / environnement.
2. Cliquez sur **+ New Resource**.
3. Choisissez **Public Repository** ou **Private Repository** (GitHub, GitLab, etc.) contenant le code de ce bot.

### Étape 2 : Configuration du Type de Build
Coolify détectera automatiquement le projet. Vous avez deux options :
- **Option A (Recommandée - Dockerfile)** : Coolify lira le fichier `Dockerfile` présent à la racine.
- **Option B (Docker Compose)** : Si vous préférez, vous pouvez configurer le projet pour utiliser le `docker-compose.yml`.

### Étape 3 : Configurer les Variables d'Environnement
Dans l'onglet **Environment Variables** de Coolify, ajoutez les variables d'environnement suivantes :
- `BOT_TOKEN` : Le jeton secret de votre bot BloumeChat (Cochez la case *Encrypt* pour plus de sécurité).
- `PREFIX` : Le préfixe de commande souhaité (par exemple `!`).
- `NODE_ENV` : `production`.

### Étape 4 : Configurer la Persistance des Données (Volumes)
Pour que vos concours et configurations de serveurs ne soient pas effacés à chaque mise à jour du bot, vous devez monter un volume persistant.
1. Allez dans l'onglet **Storage** (ou **Volumes** selon la version de Coolify) de votre application.
2. Ajoutez un nouveau volume persistant :
   - **Destination Path** : `/app/data`
   - **Volume Name** : `giveaways-bot-data` (ou le nom de votre choix)
3. Cliquez sur **Save** / **Update**.

*Note : Grâce à ce volume, le dossier `/app/data` dans le conteneur Docker est monté sur le disque dur persistant de votre serveur. Toutes les configurations et données des concours resteront saines et sauves.*

### Étape 5 : Déployer !
Cliquez sur le bouton **Deploy**. Le bot va se compiler, installer ses dépendances de production, monter le volume persistant, et se connecter à BloumeChat.
Vous pouvez suivre les logs en direct dans l'onglet **Logs** de Coolify.

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](./LICENSE) pour plus de détails. Développé par **Bloume SAS**.

