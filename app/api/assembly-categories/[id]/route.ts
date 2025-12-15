import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const category = await prisma.assemblyCategory.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        assemblies: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            assemblies: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Assembly category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assembly category" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.assemblyCategory.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description: description || null,
        color: color || null,
        icon: icon || null
      },
      include: {
        assemblies: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            assemblies: true
          }
        }
      }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Assembly category not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Assembly category with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update assembly category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const categoryId = parseInt(params.id);

  try {
    console.log(`Attempting to delete assembly category with ID: ${categoryId}`);

    // Check if category has assemblies
    const assembliesCount = await prisma.assembly.count({
      where: { categoryId: categoryId }
    });

    console.log(`Category ${categoryId} has ${assembliesCount} assemblies`);

    if (assembliesCount > 0) {
      console.log(`Returning 409 for category ${categoryId} - has assemblies`);
      return NextResponse.json(
        {
          error: "Cannot delete assembly category",
          message: `This category contains ${assembliesCount} assembly(ies). Remove all assemblies from this category first.`
        },
        { status: 409 }
      );
    }

    console.log(`Deleting assembly category ${categoryId}`);

    // Delete the category
    await prisma.assemblyCategory.delete({
      where: { id: categoryId }
    });

    console.log(`Successfully deleted assembly category ${categoryId}`);
    return NextResponse.json({ message: "Assembly category deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting assembly category ${categoryId}:`, error);

    if (error.code === 'P2025') {
      console.log(`Assembly category ${categoryId} not found`);
      return NextResponse.json(
        { error: "Assembly category not found" },
        { status: 404 }
      );
    }

    console.error('Unexpected error deleting assembly category:', error);
    return NextResponse.json(
      { error: "Failed to delete assembly category", message: error.message, code: error.code },
      { status: 500 }
    );
  }
}
