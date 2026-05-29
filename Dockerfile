FROM node:20-alpine

WORKDIR /app

# Installer les dépendances système pour Sharp
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p uploads/avatars uploads/analyses uploads/documents uploads/prescriptions uploads/recus logs

EXPOSE 5000

CMD ["node", "server.js"]
