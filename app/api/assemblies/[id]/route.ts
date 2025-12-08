import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const assembly = await prisma.assembly.findUnique({
      where: { id: parseInt(params.id) },
      include: {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assembly" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, description, docs, materials } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // First, delete existing material associations
    await prisma.assemblyMaterial.deleteMany({
      where: { assemblyId: parseInt(params.id) }
    });

    // Prepare update data
    const updateData: any = {
      name,
      description,
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

    // Then update assembly with new data
    const assembly = await prisma.assembly.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        materials: {
          include: {
            material: true
          }
        }
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const assemblyId = parseInt(params.id);

  try {
    console.log(`Attempting to delete assembly with ID: ${assemblyId}`);

    // Check if assembly is used in any templates
    const templatesCount = await prisma.templateAssembly.count({
      where: { assemblyId: assemblyId }
    });

    console.log(`Assembly ${assemblyId} is used in ${templatesCount} templates`);

    if (templatesCount > 0) {
      console.log(`Returning 409 for assembly ${assemblyId} - used in templates`);
      return NextResponse.json(
        {
          error: "Cannot delete assembly",
          message: `This assembly is used in ${templatesCount} template(s). Remove it from all templates first.`
        },
        { status: 409 }
      );
    }

    console.log(`Deleting assembly ${assemblyId}`);

    // First, delete all AssemblyMaterial records associated with this assembly
    await prisma.assemblyMaterial.deleteMany({
      where: { assemblyId: assemblyId }
    });

    // Then delete the assembly
    await prisma.assembly.delete({
      where: { id: assemblyId }
    });

    console.log(`Successfully deleted assembly ${assemblyId}`);
    return NextResponse.json({ message: "Assembly deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting assembly ${assemblyId}:`, error);

    if (error.code === 'P2025') {
      console.log(`Assembly ${assemblyId} not found`);
      return NextResponse.json(
        { error: "Assembly not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2003') {
      console.log(`Assembly ${assemblyId} has foreign key constraints`);
      return NextResponse.json(
        {
          error: "Cannot delete assembly",
          message: "This assembly is referenced by other records and cannot be deleted."
        },
        { status: 409 }
      );
    }

    console.error('Unexpected error deleting assembly:', error);
    return NextResponse.json(
      { error: "Failed to delete assembly", message: error.message, code: error.code },
      { status: 500 }
    );
  }
}
