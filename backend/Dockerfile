# ============================================================
# NOPTRIX Backend - Production Dockerfile
# ============================================================

# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better Docker cache
COPY package*.json ./

# Install all dependencies required for TypeScript build
RUN npm ci

# Copy source and TypeScript configuration
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript → dist/
RUN npm run build


# -----------------------------
# Stage 2: Production
# -----------------------------
FROM node:22-alpine AS production

WORKDIR /app

# Production environment
ENV NODE_ENV=production

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

# Application port
EXPOSE 5000

# Run as non-root user for security
USER node

# Start production server
CMD ["node", "dist/server.js"]