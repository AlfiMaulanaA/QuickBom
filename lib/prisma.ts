import { PrismaClient } from "@prisma/client";

// Get the appropriate database URL based on environment
const getDatabaseUrl = () => {
  // For Vercel deployment, prioritize DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return databaseUrl;
};

// Create Prisma client optimized for Vercel
const createPrismaClient = () => {
  const databaseUrl = getDatabaseUrl();

  // For Vercel, use simpler configuration without complex connection pooling
  const client = new PrismaClient({
    datasourceUrl: databaseUrl,
    // Disable logging in production to reduce function execution time
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client;
};

// Global Prisma client instance with connection pooling
declare global {
  var __prisma: PrismaClient | undefined;
}

// Use existing instance or create new one with optimizations
export const prisma = global.__prisma || createPrismaClient();

// Store in global for development hot reload
if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

// Connection health check function
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;

    const latency = Date.now() - startTime;

    return {
      connected: true,
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;

    return {
      connected: false,
      latency,
      error: error.message || 'Database connection failed',
    };
  }
}

// Graceful shutdown function
export async function disconnectPrisma() {
  try {
    console.log('[PRISMA] Disconnecting from database...');
    await prisma.$disconnect();
    console.log('[PRISMA] Successfully disconnected from database');
  } catch (error) {
    console.error('[PRISMA] Error during disconnection:', error);
  }
}

// Connection pool statistics (for monitoring)
export async function getConnectionStats() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_connections,
        count(*) filter (where state = 'idle') as idle_connections,
        count(*) filter (where state = 'waiting') as waiting_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    return stats;
  } catch (error) {
    console.warn('[PRISMA] Could not get connection stats:', error);
    return null;
  }
}

// Export optimized client
export default prisma;
