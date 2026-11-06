# Google Cloud Run Production Dockerfile for EventFlow (MY DUE QLQTKD)
FROM node:22-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma Clients
RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npx prisma generate --schema backend/prisma/schema.postgresql.prisma

# Build Vite React SPA Frontend
RUN npm run build

# ── Production Runtime Image ──
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/database ./database

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Run fullstack server
CMD ["npx", "tsx", "server.ts"]
