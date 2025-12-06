import { PrismaClient } from "@prisma/client";

// Get the appropriate database URL based on environment
const getDatabaseUrl = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // In production, use Supabase database URL
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_DATABASE_URL environment variable is required in production");
    }
    return supabaseUrl;
  } else {
    // In development, use local PostgreSQL
    const localUrl = process.env.DATABASE_URL;
    if (!localUrl) {
      throw new Error("DATABASE_URL environment variable is required in development");
    }
    return localUrl;
  }
};

// Connection pool configuration based on environment
const getConnectionConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const databaseUrl = getDatabaseUrl();

  return {
    // Connection pool settings - adjusted for Supabase in production
    connection_limit: isProduction ? 10 : 5, // Supabase has connection limits
    pool_timeout: isProduction ? 30 : 20, // Longer timeout for Supabase
    connection_timeout: isProduction ? 20 : 10, // Longer connection timeout

    // Additional PostgreSQL-specific settings
    max_wait: isProduction ? 10000 : 5000, // Longer wait time for production
    max_idle: isProduction ? 30000 : 10000, // Longer idle time
    max_lifetime: isProduction ? 300000 : 600000, // Shorter lifetime for Supabase

    // SSL settings - always enable for Supabase
    ssl: { rejectUnauthorized: false },
  };
};

// Create optimized Prisma client with connection pooling
const createPrismaClient = () => {
  const connectionConfig = getConnectionConfig();
  const databaseUrl = getDatabaseUrl();

  // Build connection string with pool parameters
  const baseUrl = databaseUrl.split('?')[0];
  const poolParams = new URLSearchParams();

  // Only add numeric and boolean parameters to URL
  if (connectionConfig.connection_limit) {
    poolParams.append('connection_limit', connectionConfig.connection_limit.toString());
  }
  if (connectionConfig.pool_timeout) {
    poolParams.append('pool_timeout', connectionConfig.pool_timeout.toString());
  }
  if (connectionConfig.connection_timeout) {
    poolParams.append('connection_timeout', connectionConfig.connection_timeout.toString());
  }
  if (connectionConfig.max_wait) {
    poolParams.append('max_wait', connectionConfig.max_wait.toString());
  }
  if (connectionConfig.max_idle) {
    poolParams.append('max_idle', connectionConfig.max_idle.toString());
  }
  if (connectionConfig.max_lifetime) {
    poolParams.append('max_lifetime', connectionConfig.max_lifetime.toString());
  }

  const optimizedDatabaseUrl = `${baseUrl}?${poolParams.toString()}`;

  const client = new PrismaClient({
    datasourceUrl: optimizedDatabaseUrl,
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
