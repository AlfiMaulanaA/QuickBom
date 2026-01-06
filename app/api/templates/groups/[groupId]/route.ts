import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
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
    const existingGroup = await prisma.templateAssemblyGroup.findUnique({
      where: { id: params.groupId }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Update group
    const updatedGroup = await prisma.templateAssemblyGroup.update({
      where: { id: params.groupId },
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
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error: any) {
    console.error('API Error [PUT /api/templates/groups/[groupId]]:', error);
    return NextResponse.json(
      { error: "Failed to update template group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // Verify group exists
    const existingGroup = await prisma.templateAssemblyGroup.findUnique({
      where: { id: params.groupId }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Delete group (cascade will delete items)
    await prisma.templateAssemblyGroup.delete({
      where: { id: params.groupId }
    });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error: any) {
    console.error('API Error [DELETE /api/templates/groups/[groupId]]:', error);
    return NextResponse.json(
      { error: "Failed to delete template group" },
      { status: 500 }
    );
  }
}
