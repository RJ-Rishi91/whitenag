FROM node:22-alpine AS builder

WORKDIR /app

# Build Web Frontend
COPY web/package*.json ./web/
RUN cd web && npm ci

COPY web/ ./web/
RUN cd web && npm run build

# Setup Backend API
COPY api/package*.json ./api/
RUN cd api && npm ci --omit=dev

COPY api/ ./api/

WORKDIR /app/api
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
