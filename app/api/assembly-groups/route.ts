import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const where: any = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

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

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('API Error [GET /api/assembly-groups]:', error);
    return NextResponse.json(
      { error: "Failed to fetch assembly groups" },
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
    const group = await prisma.assemblyGroup.create({
      data: {
        name,
        description: description || null,
        groupType,
        categoryId,
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            assemblyId: item.assemblyId,
            quantity: item.quantity || 1,
            conflictsWith: item.conflictsWith || [],
            isDefault: item.isDefault || false,
            sortOrder: item.sortOrder || 0
          }))
        } : undefined
      },
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
