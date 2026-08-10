FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Update npm to latest to fix npm ci compatibility issues
RUN npm install -g npm@latest

RUN npm ci --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
