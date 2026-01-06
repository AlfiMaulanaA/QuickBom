import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    const groups = await prisma.templateAssemblyGroup.findMany({
      where: { templateId: parseInt(templateId) },
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
                }
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
    console.error('API Error [GET /api/templates/groups]:', error);
    return NextResponse.json(
      { error: "Failed to fetch template groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, categoryId, name, description, groupType, items } = body;

    if (!templateId || !categoryId || !name || !groupType) {
      return NextResponse.json(
        { error: "templateId, categoryId, name, and groupType are required" },
        { status: 400 }
      );
    }

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
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

    // Create group with items
    const group = await prisma.templateAssemblyGroup.create({
      data: {
        name,
        description: description || null,
        groupType,
        categoryId,
        templateId,
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
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error('API Error [POST /api/templates/groups]:', error);
    return NextResponse.json(
      { error: "Failed to create template group" },
      { status: 500 }
    );
  }
}
