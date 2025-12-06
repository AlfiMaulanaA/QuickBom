import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        template: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, clientId, fromTemplateId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Calculate total price if template is provided
    let totalPrice = 0;
    if (fromTemplateId) {
      const template = await prisma.template.findUnique({
        where: { id: fromTemplateId },
        include: {
          assemblies: {
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

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      // Calculate total price from template
      for (const templateAssembly of template.assemblies) {
        const assembly = templateAssembly.assembly;
        for (const assemblyMaterial of assembly.materials) {
          const material = assemblyMaterial.material;
          totalPrice += Number(material.price) * Number(assemblyMaterial.quantity) * Number(templateAssembly.quantity);
        }
      }
    }

    const project = await prisma.project.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        clientId,
        fromTemplateId,
        totalPrice
      },
      include: {
        template: true
      }
    });

    return NextResponse.json(project);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const projectId = parseInt(params.id);

  try {
    console.log(`Attempting to delete project with ID: ${projectId}`);

    // Projects don't have direct dependencies in the current schema,
    // but we should still check for any potential foreign key constraints
    console.log(`Deleting project ${projectId}`);
    await prisma.project.delete({
      where: { id: projectId }
    });

    console.log(`Successfully deleted project ${projectId}`);
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting project ${projectId}:`, error);

    if (error.code === 'P2025') {
      console.log(`Project ${projectId} not found`);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2003') {
      console.log(`Project ${projectId} has foreign key constraints`);
      return NextResponse.json(
        {
          error: "Cannot delete project",
          message: "This project is referenced by other records and cannot be deleted."
        },
        { status: 409 }
      );
    }

    console.error('Unexpected error deleting project:', error);
    return NextResponse.json(
      { error: "Failed to delete project", message: error.message, code: error.code },
      { status: 500 }
    );
  }
}
