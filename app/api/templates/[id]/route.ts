import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(params.id) },
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
        },
        projects: true
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { name, description, assemblies } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // First, delete existing assembly associations
    await prisma.templateAssembly.deleteMany({
      where: { templateId: parseInt(params.id) }
    });

    // Prepare update data
    const updateData: any = {
      name,
      description
    };

    // Add assemblies if provided
    if (assemblies && assemblies.length > 0) {
      updateData.assemblies = {
        create: assemblies.map((a: any) => ({
          assemblyId: a.assemblyId,
          quantity: a.quantity
        }))
      };
    }

    // Then update template with new data
    const template = await prisma.template.update({
      where: { id: parseInt(params.id) },
      data: updateData,
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

    return NextResponse.json(template);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const templateId = parseInt(params.id);

  try {
    console.log(`Attempting to delete template with ID: ${templateId}`);

    // Check if template is used in any projects
    const projectsCount = await prisma.project.count({
      where: { fromTemplateId: templateId }
    });

    console.log(`Template ${templateId} is used in ${projectsCount} projects`);

    if (projectsCount > 0) {
      console.log(`Returning 409 for template ${templateId} - used in projects`);
      return NextResponse.json(
        {
          error: "Cannot delete template",
          message: `This template is used in ${projectsCount} project(s). Remove it from all projects first.`
        },
        { status: 409 }
      );
    }

    console.log(`Deleting template ${templateId}`);

    // First, delete all TemplateAssembly records associated with this template
    await prisma.templateAssembly.deleteMany({
      where: { templateId: templateId }
    });

    // Then delete the template
    await prisma.template.delete({
      where: { id: templateId }
    });

    console.log(`Successfully deleted template ${templateId}`);
    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting template ${templateId}:`, error);

    if (error.code === 'P2025') {
      console.log(`Template ${templateId} not found`);
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2003') {
      console.log(`Template ${templateId} has foreign key constraints`);
      return NextResponse.json(
        {
          error: "Cannot delete template",
          message: "This template is referenced by other records and cannot be deleted."
        },
        { status: 409 }
      );
    }

    console.error('Unexpected error deleting template:', error);
    return NextResponse.json(
      { error: "Failed to delete template", message: error.message, code: error.code },
      { status: 500 }
    );
  }
}
