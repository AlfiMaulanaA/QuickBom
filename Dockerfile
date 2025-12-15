# =============================================================================
#  QUICKBOM DOCKERFILE
# =============================================================================
# Multi-stage Dockerfile for QuickBom Next.js application
# Optimized for production deployment with database migration support
# =============================================================================

# -----------------------------------------------------------------------------
#  BUILD STAGE: Prepare dependencies and build the application
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for Prisma and build tools
RUN apk add --no-cache libc6-compat openssl

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Copy Prisma schema for generation
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
#  PRODUCTION STAGE: Create optimized production image
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Install system dependencies for runtime
RUN apk add --no-cache libc6-compat openssl postgresql-client

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy other necessary files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

# Switch to non-root user
USER nextjs

# Expose port 4000 (as requested)
EXPOSE 4000

# Set environment variables
ENV PORT=4000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["npm", "start"]
