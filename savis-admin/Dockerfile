# Étape 1 : Environnement de Base + Dépendances
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 🎯 NOUVELLE ÉTAPE : Cible pour le développement local
FROM base AS development
COPY . .
# On laisse Docker Compose gérer le démarrage en dev
CMD ["npm", "run", "dev", "--", "--host"]

# Étape 3 : Build des fichiers statiques pour la production
FROM base AS build
COPY . .
RUN npm run build

# Étape 4 : Serveur de Production Final (Nginx)
FROM nginx:1.25-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]