// Simple database connection test
const { PrismaClient } = require('@prisma/client');

// Get database URL based on environment
const getDatabaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required in production");
    }
    return supabaseUrl;
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required in development");
  }
  
  return databaseUrl;
};

async function testConnection() {
  const databaseUrl = getDatabaseUrl();
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  
  console.log('🔗 Testing database connection...');
  console.log(`📍 URL: ${databaseUrl.replace(/:[^:]+@/, ':***@')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const latency = Date.now() - startTime;
    
    console.log('✅ Database connection successful!');
    console.log(`⚡ Latency: ${latency}ms`);
    
    // Get some stats
    try {
      const userCount = await prisma.user.count();
      const clientCount = await prisma.client.count();
      console.log(`👥 Users: ${userCount}, 🏢 Clients: ${clientCount}`);
    } catch (err) {
      // Ignore stats error
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`💥 Error: ${error.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
