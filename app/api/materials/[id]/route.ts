import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(material);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, partNumber, manufacturer, unit, price } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: "Name and unit are required" },
        { status: 400 }
      );
    }

    const material = await prisma.material.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        partNumber,
        manufacturer,
        unit,
        price: price || 0
      }
    });

    return NextResponse.json(material);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Material with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const materialId = parseInt(params.id);

  try {
    console.log(`Attempting to delete material with ID: ${materialId}`);

    // Check if material is used in any assemblies
    const assembliesCount = await prisma.assemblyMaterial.count({
      where: { materialId: materialId }
    });

    console.log(`Material ${materialId} is used in ${assembliesCount} assemblies`);

    if (assembliesCount > 0) {
      console.log(`Returning 409 for material ${materialId} - used in assemblies`);
      return NextResponse.json(
        {
          error: "Cannot delete material",
          message: `This material is used in ${assembliesCount} assembly(ies). Remove it from all assemblies first.`
        },
        { status: 409 }
      );
    }

    console.log(`Deleting material ${materialId}`);
    await prisma.material.delete({
      where: { id: materialId }
    });

    console.log(`Successfully deleted material ${materialId}`);
    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting material ${materialId}:`, error);

    if (error.code === 'P2025') {
      console.log(`Material ${materialId} not found`);
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2003') {
      console.log(`Material ${materialId} has foreign key constraints`);
      return NextResponse.json(
        {
          error: "Cannot delete material",
          message: "This material is referenced by other records and cannot be deleted."
        },
        { status: 409 }
      );
    }

    console.error('Unexpected error deleting material:', error);
    return NextResponse.json(
      { error: "Failed to delete material", message: error.message, code: error.code },
      { status: 500 }
    );
  }
}
