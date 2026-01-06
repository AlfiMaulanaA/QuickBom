import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('[API] GET /api/assemblies - Starting fetch');
    const assemblies = await prisma.assembly.findMany({
      include: {
        materials: {
          include: {
            material: true
          }
        },
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
        ...(materials && materials.length > 0 ? {
          materials: {
            create: materials.map((m: any) => ({
              materialId: m.materialId,
              quantity: m.quantity
            }))
          }
        } : {})
      },
      include: {
        materials: {
          include: {
            material: true
          }
        },
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
