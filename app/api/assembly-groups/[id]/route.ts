import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.assemblyGroup.findUnique({
      where: { id: params.id },
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
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "Assembly group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error: any) {
    console.error('API Error [GET /api/assembly-groups/[id]]:', error);
    return NextResponse.json(
      { error: "Failed to fetch assembly group" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, groupType, items } = body;

    if (!name || !groupType) {
      return NextResponse.json(
        { error: "name and groupType are required" },
        { status: 400 }
      );
    }

    // Verify group exists
    const existingGroup = await prisma.assemblyGroup.findUnique({
      where: { id: params.id },
      include: { category: true }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Assembly group not found" },
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

        if (assembly.category.id !== existingGroup.categoryId) {
          return NextResponse.json(
            { error: `Assembly "${assembly.name}" does not belong to the group's category` },
            { status: 400 }
          );
        }
      }
    }

    // Update group
    const updatedGroup = await prisma.assemblyGroup.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        groupType,
        // Update items if provided
        ...(items && {
          items: {
            deleteMany: {}, // Remove existing items
            create: items.map((item: any) => ({
              assemblyId: item.assemblyId,
              quantity: item.quantity || 1,
              conflictsWith: item.conflictsWith || [],
              isDefault: item.isDefault || false,
              sortOrder: item.sortOrder || 0
            }))
          }
        })
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
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error: any) {
    console.error('API Error [PUT /api/assembly-groups/[id]]:', error);
    return NextResponse.json(
      { error: "Failed to update assembly group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify group exists
    const existingGroup = await prisma.assemblyGroup.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Assembly group not found" },
        { status: 404 }
      );
    }

    // Delete all items in the group first (cascade delete)
    if (existingGroup._count.items > 0) {
      await prisma.assemblyGroupItem.deleteMany({
        where: { groupId: params.id }
      });
    }

    // Now delete the group
    await prisma.assemblyGroup.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: "Assembly group deleted successfully",
      itemsRemoved: existingGroup._count.items
    });
  } catch (error: any) {
    console.error('API Error [DELETE /api/assembly-groups/[id]]:', error);
    return NextResponse.json(
      { error: "Failed to delete assembly group" },
      { status: 500 }
    );
  }
}
