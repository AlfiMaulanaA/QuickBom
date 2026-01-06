import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Environment check');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('SUPABASE_DATABASE_URL exists:', !!process.env.SUPABASE_DATABASE_URL);

    // Test database connection
    console.log('[DEBUG] Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[DEBUG] Database connection OK');

    // Check what tables exist
    console.log('[DEBUG] Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'Client', 'Material', 'Assembly', 'AssemblyGroup', 'AssemblyGroupItem', 'Template', 'AssemblyCategory')
      ORDER BY table_name
    ` as any[];

    console.log('[DEBUG] Tables found:', tables.map(t => t.table_name));

    // Check record counts
    const counts = {
      users: 0,
      clients: 0,
      materials: 0,
      assemblies: 0,
      assemblyGroups: 0,
      assemblyGroupItems: 0,
      templates: 0,
      categories: 0
    };

    try { counts.users = await prisma.user.count(); } catch (e: any) { console.log('User count error:', e?.message); }
    try { counts.clients = await prisma.client.count(); } catch (e: any) { console.log('Client count error:', e?.message); }
    try { counts.materials = await prisma.material.count(); } catch (e: any) { console.log('Material count error:', e?.message); }
    try { counts.assemblies = await prisma.assembly.count(); } catch (e: any) { console.log('Assembly count error:', e?.message); }
    try { counts.assemblyGroups = await prisma.assemblyGroup.count(); } catch (e: any) { console.log('AssemblyGroup count error:', e?.message); }
    try { counts.assemblyGroupItems = await prisma.assemblyGroupItem.count(); } catch (e: any) { console.log('AssemblyGroupItem count error:', e?.message); }
    try { counts.templates = await prisma.template.count(); } catch (e: any) { console.log('Template count error:', e?.message); }
    try { counts.categories = await prisma.assemblyCategory.count(); } catch (e: any) { console.log('AssemblyCategory count error:', e?.message); }

    console.log('[DEBUG] Record counts:', counts);

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        tables: tables.map(t => t.table_name),
        counts
      }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      error: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    }, { status: 500 });
  }
}