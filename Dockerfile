FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install npm 10 (compatible with Node 20, fixes EBADENGINE)
RUN npm install -g npm@10

RUN npm ci --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
