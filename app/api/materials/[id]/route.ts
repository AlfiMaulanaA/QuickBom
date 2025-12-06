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
  } catch (error: any) {
    console.error('API Error [GET /api/materials/[id]]:', error);

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
        error: "Failed to fetch material",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
    console.error('API Error [PUT /api/materials/[id]]:', error);

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
        error: "Failed to update material",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
    console.error(`API Error [DELETE /api/materials/[id]] for material ${materialId}:`, error);

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

    console.error('Unexpected error deleting material:', error);
    return NextResponse.json(
      {
        error: "Failed to delete material",
        message: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
