FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 3000

# Datenbankverzeichnis als Volume einbinden
VOLUME ["/app/data"]

CMD ["npm", "start"]
