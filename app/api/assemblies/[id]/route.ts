import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const assemblyId = parseInt(id);

    if (isNaN(assemblyId)) {
      return NextResponse.json(
        { error: "Invalid assembly ID" },
        { status: 400 }
      );
    }

    const assembly = await prisma.assembly.findUnique({
      where: { id: assemblyId },
      include: {
        category: true,
        materials: {
          include: {
            material: true
          }
        }
      }
    });

    if (!assembly) {
      return NextResponse.json(
        { error: "Assembly not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assembly);
  } catch (error: any) {
    console.error('API Error [GET /api/assemblies/[id]]:', error);
    return NextResponse.json(
      { error: "Failed to fetch assembly" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const assemblyId = parseInt(id);

    if (isNaN(assemblyId)) {
      return NextResponse.json(
        { error: "Invalid assembly ID" },
        { status: 400 }
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

    // First, delete existing material associations
    await prisma.assemblyMaterial.deleteMany({
      where: { assemblyId: assemblyId }
    });

    // Prepare update data
    const updateData: any = {
      name,
      description: description || null,
      module: module || 'ELECTRICAL',
      categoryId,
      docs: docs || null
    };

    // Add materials if provided
    if (materials && materials.length > 0) {
      updateData.materials = {
        create: materials.map((m: any) => ({
          materialId: m.materialId,
          quantity: m.quantity
        }))
      };
    }

    // Update assembly with new data
    const assembly = await prisma.assembly.update({
      where: { id: assemblyId },
      data: updateData,
      include: {
        materials: {
          include: {
            material: true
          }
        },
        category: true
      }
    });

    return NextResponse.json(assembly);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Assembly not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Assembly with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update assembly" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const assemblyId = parseInt(id);

    if (isNaN(assemblyId)) {
      return NextResponse.json(
        { error: "Invalid assembly ID" },
        { status: 400 }
      );
    }

    // Check if assembly is used in any templates
    const templateCount = await prisma.templateAssembly.count({
      where: { assemblyId: assemblyId }
    });

    if (templateCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete assembly",
          message: `This assembly is used in ${templateCount} template(s). Remove it from all templates first.`
        },
        { status: 409 }
      );
    }

    // Delete all material associations first to avoid foreign key constraint
    await prisma.assemblyMaterial.deleteMany({
      where: { assemblyId: assemblyId }
    });

    // Delete assembly
    await prisma.assembly.delete({
      where: { id: assemblyId }
    });

    return NextResponse.json({ message: "Assembly deleted successfully" });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Assembly not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete assembly" },
      { status: 500 }
    );
  }
}
