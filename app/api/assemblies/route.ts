import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    console.log('[API] GET /api/assemblies - Starting fetch');
    const assemblies = await prisma.assembly.findMany({
      include: {
        materials: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[API] GET /api/assemblies - Found ${assemblies?.length || 0} assemblies`);

    // Ensure we return an array even if database is empty
    if (!assemblies) {
      console.log('[API] GET /api/assemblies - No assemblies found, returning empty array');
      return NextResponse.json([]);
    }

    console.log('[API] GET /api/assemblies - Returning assemblies successfully');
    return NextResponse.json(assemblies);
  } catch (error: any) {
    console.error('API Error [GET /api/assemblies]:', error);

    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: "Database server unreachable", details: "Please check database connection" },
        { status: 503 }
      );
    }

    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: "Database operation timeout", details: "Request took too long to process" },
        { status: 504 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to fetch assemblies",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { name, description, docs, materials, categoryId, module } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.assemblyCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Selected category does not exist" },
        { status: 400 }
      );
    }

    const assembly = await prisma.assembly.create({
      data: {
        name,
        description: description || null,
        module: module || 'ELECTRICAL', // Default to ELECTRICAL if not provided
        categoryId,
        docs: docs || null,
        materials: {
          create: materials?.map((m: any) => ({
            externalId: m.externalId.toString(), // Ensure string
            name: m.name,
            partNumber: m.partNumber || null,
            partDesc: m.partDesc || null,
            manufacturer: m.manufacturer || null,
            unit: m.unit,
            price: Number(m.price),
            quantity: Number(m.quantity)
          })) || []
        }
      },
      include: {
        materials: true, // No nested include material needed anymore
        category: true
      }
    });

    return NextResponse.json(assembly, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Assembly with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create assembly" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request: ids array is required" },
        { status: 400 }
      );
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { message: "No IDs provided, nothing to delete" },
        { status: 200 }
      );
    }

    // Check which IDs are actually deleteable (not used in templates or groups)
    const inTemplates = await prisma.templateAssembly.findMany({
      where: { assemblyId: { in: ids } },
      select: { assemblyId: true, template: { select: { name: true } } }
    });

    const inGroups = await prisma.assemblyGroupItem.findMany({
      where: { assemblyId: { in: ids } },
      select: { assemblyId: true, group: { select: { name: true } } }
    });

    const blockedIds = new Set([
      ...inTemplates.map(t => t.assemblyId),
      ...inGroups.map(g => g.assemblyId)
    ]);

    const deleteableIds = ids.filter(id => !blockedIds.has(id));

    if (deleteableIds.length === 0) {
      return NextResponse.json(
        {
          error: "Selected assemblies are in use",
          details: "All selected assemblies are linked to templates or groups. Remove them first."
        },
        { status: 409 }
      );
    }

    // Run deletion in a transaction
    await prisma.$transaction([
      // Delete dependency materials first
      prisma.assemblyMaterial.deleteMany({
        where: { assemblyId: { in: deleteableIds } }
      }),
      // Delete assemblies
      prisma.assembly.deleteMany({
        where: { id: { in: deleteableIds } }
      })
    ]);

    return NextResponse.json({
      message: `Successfully deleted ${deleteableIds.length} assemblies`,
      deletedCount: deleteableIds.length,
      skippedCount: blockedIds.size,
      skippedIds: Array.from(blockedIds)
    });

  } catch (error: any) {
    console.error('API Error [DELETE /api/assemblies]:', error);
    return NextResponse.json(
      { error: "Failed to delete assemblies", details: error.message },
      { status: 500 }
    );
  }
}
