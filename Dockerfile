# =============================================================================
#  PRODUCT CONFIGURATOR DOCKERFILE
# =============================================================================
# Multi-stage Dockerfile for Product Configurator Next.js application
# Optimized for production deployment with standalone output mode
# =============================================================================

# -----------------------------------------------------------------------------
#  BUILD STAGE
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Install system dependencies for Prisma and build tools
RUN apk add --no-cache libc6-compat openssl

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application with dummy env vars for build-time only
# These are not used at runtime - real values come from docker-compose environment
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" \
  DIRECT_URL="postgresql://dummy:dummy@localhost/dummy" \
  JWT_SECRET="dummy-build-secret-not-used-in-production" \
  npm run build

# -----------------------------------------------------------------------------
#  PRODUCTION STAGE
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

# Install system dependencies for runtime
# IMPORTANT: Added curl for docker-compose healthchecks
RUN apk add --no-cache libc6-compat openssl postgresql-client curl

# Environment variables
ENV NODE_ENV=production
ENV PORT=3200
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# Create required directories with correct permissions before switching user
RUN mkdir -p uploads backups && chown -R nextjs:nodejs uploads backups

# Standalone mode: Copy only necessary files from builder
# Next.js standalone build includes minimal node_modules required for the server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3200

# Health check (Dockerfile version - fallback if orchestrator doesn't use docker-compose healthcheck)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3200/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application using modern standalone server
# This replaces `npm start` which is more resource-intensive
CMD ["node", "server.js"]
