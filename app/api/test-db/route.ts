import { NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('[TEST-DB] Starting database connection test');

    // Test 1: Basic connection
    const connectionTest = await checkDatabaseConnection();
    console.log('[TEST-DB] Connection test result:', connectionTest);

    // Test 2: Simple query
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version` as any;
    const queryTime = Date.now() - startTime;
    console.log('[TEST-DB] Query test result:', result);

    // Test 3: Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log('[TEST-DB] Tables found:', tables);

    // Test 4: Check user table specifically
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
      console.log('[TEST-DB] User count:', userCount);
    } catch (error) {
      console.warn('[TEST-DB] User table test failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        connection: connectionTest,
        queryTime: `${queryTime}ms`,
        currentTime: result[0].current_time,
        dbVersion: result[0].db_version,
        tableCount: Array.isArray(tables) ? tables.length : 0,
        userCount,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
          supabaseUrl: process.env.SUPABASE_DATABASE_URL ? 'SET (hidden)' : 'NOT SET'
        }
      }
    });

  } catch (error: any) {
    console.error('[TEST-DB] Database test failed:', error);

    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: {
        message: error.message,
        code: error.code,
        meta: error.meta
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
        supabaseUrl: process.env.SUPABASE_DATABASE_URL ? 'SET (hidden)' : 'NOT SET'
      }
    }, { status: 500 });
  }
}
