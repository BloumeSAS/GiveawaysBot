FROM node:20-alpine

# Configuration de l'environnement de production
ENV NODE_ENV=production

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --omit=dev

# Copie des fichiers sources de l'application
COPY src/ ./src/

# Création du dossier de persistance avec les bonnes permissions pour l'utilisateur non-root
RUN mkdir -p /app/data && chown -R node:node /app

# Passage à l'utilisateur non-root pour des raisons de sécurité
USER node

# Commande de démarrage du bot
CMD ["node", "src/index.js"]
