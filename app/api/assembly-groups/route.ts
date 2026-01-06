import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/assembly-groups - Starting request');

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    console.log('[API] Query params:', { categoryId });

    const where: any = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
      console.log('[API] Filtering by categoryId:', where.categoryId);
    }

    // Test database connection first
    console.log('[API] Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[API] Database connection OK');

    // Check if tables exist
    console.log('[API] Checking if AssemblyGroup table exists...');
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'AssemblyGroup'
      ) as exists
    ` as any;
    console.log('[API] AssemblyGroup table exists:', tableCheck[0]?.exists);

    // Check if Prisma client has the model
    console.log('[API] Checking if prisma.assemblyGroup exists:', typeof prisma.assemblyGroup);

    const groups = await prisma.assemblyGroup.findMany({
      where,
      include: {
        category: true,
        items: {
          include: {
            assembly: {
              include: {
                materials: {
                  include: {
                    material: true
                  }
                },
                category: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [
        { categoryId: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    console.log(`[API] Successfully fetched ${groups.length} assembly groups`);
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('[API] GET /api/assembly-groups - Full error details:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    console.error('Stack trace:', error.stack);

    return NextResponse.json(
      {
        error: "Failed to fetch assembly groups",
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, name, description, groupType, items } = body;

    if (!categoryId || !name || !groupType) {
      return NextResponse.json(
        { error: "categoryId, name, and groupType are required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.assemblyCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify assemblies exist and belong to the category
    if (items && items.length > 0) {
      for (const item of items) {
        const assembly = await prisma.assembly.findUnique({
          where: { id: item.assemblyId },
          include: { category: true }
        });

        if (!assembly) {
          return NextResponse.json(
            { error: `Assembly with ID ${item.assemblyId} not found` },
            { status: 400 }
          );
        }

        if (assembly.category.id !== categoryId) {
          return NextResponse.json(
            { error: `Assembly "${assembly.name}" does not belong to the selected category` },
            { status: 400 }
          );
        }
      }
    }

    // Create group with items
    const groupData: any = {
      name,
      description: description || null,
      groupType,
      categoryId,
    };

    if (items && items.length > 0) {
      groupData.items = {
        create: items.map((item: any) => ({
          assemblyId: item.assemblyId,
          quantity: item.quantity || 1,
          conflictsWith: item.conflictsWith || [],
          isDefault: item.isDefault || false,
          sortOrder: item.sortOrder || 0
        }))
      };
    }

    const group = await prisma.assemblyGroup.create({
      data: groupData,
      include: {
        category: true,
        items: {
          include: {
            assembly: {
              include: {
                materials: {
                  include: {
                    material: true
                  }
                },
                category: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error('API Error [POST /api/assembly-groups]:', error);
    return NextResponse.json(
      { error: "Failed to create assembly group" },
      { status: 500 }
    );
  }
}
